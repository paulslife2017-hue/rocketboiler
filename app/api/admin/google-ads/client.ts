import {createCipheriv,createDecipheriv,createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';

export const SITE_HOST='rocketboiler.vercel.app';
export const CUSTOMER_ID='6409045845';
export const LOGIN_CUSTOMER_ID='7095577125';
const API_VERSION='v25';
const REDIRECT_URI=`https://${SITE_HOST}/api/admin/google-ads/oauth/callback`;
type Token={refreshToken:string};

function required(name:string){const value=process.env[name]?.trim();if(!value)throw Error(`Google Ads ${name} 설정이 없습니다.`);return value;}
function encryptionKey(){return createHash('sha256').update('google-ads:'+required('DATABASE_URL')).digest();}
export function encryptToken(token:Token){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',encryptionKey(),iv);const data=Buffer.concat([cipher.update(JSON.stringify(token)),cipher.final()]);return [iv,cipher.getAuthTag(),data].map(v=>v.toString('base64url')).join('.');}
export function decryptToken(value:string):Token{const [iv,tag,data]=value.split('.').map(v=>Buffer.from(v,'base64url'));const cipher=createDecipheriv('aes-256-gcm',encryptionKey(),iv);cipher.setAuthTag(tag);return JSON.parse(Buffer.concat([cipher.update(data),cipher.final()]).toString());}

function stateSecret(){return required('GOOGLE_ADS_OAUTH_STATE_SECRET');}
export function oauthState(){const payload=Buffer.from(JSON.stringify({exp:Date.now()+10*60_000,nonce:randomBytes(16).toString('hex')})).toString('base64url');const signature=createHmac('sha256',stateSecret()).update(payload).digest('base64url');return `${payload}.${signature}`;}
export function validState(value:string){try{const [payload,signature]=value.split('.');const expected=createHmac('sha256',stateSecret()).update(payload).digest(),supplied=Buffer.from(signature,'base64url');if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))return false;const decoded=JSON.parse(Buffer.from(payload,'base64url').toString());return typeof decoded.exp==='number'&&decoded.exp>Date.now()&&decoded.exp<Date.now()+11*60_000;}catch{return false;}}
export function authorizationUrl(){const params=new URLSearchParams({client_id:required('GOOGLE_ADS_CLIENT_ID'),redirect_uri:REDIRECT_URI,response_type:'code',scope:'https://www.googleapis.com/auth/adwords',access_type:'offline',prompt:'consent',include_granted_scopes:'true',state:oauthState()});return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;}
export async function exchangeCode(code:string){const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({code,client_id:required('GOOGLE_ADS_CLIENT_ID'),client_secret:required('GOOGLE_ADS_CLIENT_SECRET'),redirect_uri:REDIRECT_URI,grant_type:'authorization_code'}),cache:'no-store',signal:AbortSignal.timeout(15000)});const data=await response.json();if(!response.ok||typeof data.refresh_token!=='string')throw Error('Google Ads 승인 토큰을 받지 못했습니다. 다시 연결해 주세요.');return {refreshToken:data.refresh_token} as Token;}
async function accessToken(token:Token){const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:required('GOOGLE_ADS_CLIENT_ID'),client_secret:required('GOOGLE_ADS_CLIENT_SECRET'),refresh_token:token.refreshToken,grant_type:'refresh_token'}),cache:'no-store',signal:AbortSignal.timeout(15000)});const data=await response.json();if(!response.ok||typeof data.access_token!=='string')throw Error('Google Ads 재승인이 필요합니다.');return data.access_token as string;}
async function api(token:Token,path:string,body:unknown){const bearer=await accessToken(token);const headers:Record<string,string>={'content-type':'application/json',authorization:`Bearer ${bearer}`,'login-customer-id':process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID||LOGIN_CUSTOMER_ID};if(process.env.GOOGLE_ADS_DEVELOPER_TOKEN)headers['developer-token']=process.env.GOOGLE_ADS_DEVELOPER_TOKEN;const response=await fetch(`https://googleads.googleapis.com/${API_VERSION}${path}`,{method:'POST',headers,body:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(20000)});const data=await response.json();if(!response.ok){const raw=JSON.stringify(data?.error||{});if(/CLOUD_PROJECT_NOT_APPROVED_FOR_PRODUCTION|ACTION_NOT_PERMITTED/.test(raw))throw Error('Google Cloud 프로젝트의 제품계정 API 권한 승인이 필요합니다.');throw Error(`Google Ads API 조회 실패 (${response.status})`);}return data;}
type AdsRow={campaign?:{id?:string;name?:string;status?:string;advertisingChannelType?:string;biddingStrategyType?:string;geoTargetTypeSetting?:{positiveGeoTargetType?:string}};campaignBudget?:{amountMicros?:string|number};campaignCriterion?:{location?:{geoTargetConstant?:string};negative?:boolean};geoTargetConstant?:{resourceName?:string;countryCode?:string;targetType?:string;canonicalName?:string};metrics?:Record<string,string|number|undefined>};
function rows(data:unknown):AdsRow[]{if(!Array.isArray(data))return [];return data.flatMap(part=>{if(!part||typeof part!=='object'||!('results' in part)||!Array.isArray(part.results))return [];return part.results as AdsRow[];});}
const num=(v:unknown)=>Number(v)||0;
export async function campaigns(token:Token){
  const customer=process.env.GOOGLE_ADS_CUSTOMER_ID||CUSTOMER_ID;
  const path=`/customers/${customer}/googleAds:searchStream`;
  const campaignQuery="SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign.bidding_strategy_type, campaign.geo_target_type_setting.positive_geo_target_type, campaign_budget.amount_micros FROM campaign WHERE campaign.status != 'REMOVED'";
  const metricsQuery="SELECT campaign.id, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.average_cpc, metrics.search_impression_share, metrics.search_rank_lost_impression_share, metrics.search_budget_lost_impression_share, metrics.search_top_impression_share, metrics.search_absolute_top_impression_share FROM campaign WHERE campaign.status != 'REMOVED' AND segments.date DURING LAST_30_DAYS";
  const [campaignData,metricsData]=await Promise.all([api(token,path,{query:campaignQuery}),api(token,path,{query:metricsQuery})]);
  const metricsById=new Map(rows(metricsData).map(row=>[String(row.campaign?.id||''),row.metrics]));
  return rows(campaignData).map(row=>{
    const metrics=metricsById.get(String(row.campaign?.id||''));
    return {id:String(row.campaign?.id||''),customerId:customer,name:String(row.campaign?.name||''),status:String(row.campaign?.status||'PAUSED'),channelType:String(row.campaign?.advertisingChannelType||'UNKNOWN'),geoTargetType:String(row.campaign?.geoTargetTypeSetting?.positiveGeoTargetType||'UNKNOWN'),budget:num(row.campaignBudget?.amountMicros)/1_000_000,metrics:{impressions:num(metrics?.impressions),clicks:num(metrics?.clicks),cost:num(metrics?.costMicros)/1_000_000,conversions:num(metrics?.conversions),averageCpc:num(metrics?.averageCpc)/1_000_000},position:{impressionShare:num(metrics?.searchImpressionShare),rankLostShare:num(metrics?.searchRankLostImpressionShare),budgetLostShare:num(metrics?.searchBudgetLostImpressionShare),topShare:num(metrics?.searchTopImpressionShare),absoluteTopShare:num(metrics?.searchAbsoluteTopImpressionShare)},biddingStrategy:String(row.campaign?.biddingStrategyType||'UNKNOWN')};
  }).filter(c=>c.id&&c.name);
}
async function assertRegionalTargeting(token:Token,id:string){
  const customer=process.env.GOOGLE_ADS_CUSTOMER_ID||CUSTOMER_ID;
  const path=`/customers/${customer}/googleAds:searchStream`;
  const criteria=rows(await api(token,path,{query:`SELECT campaign_criterion.location.geo_target_constant, campaign_criterion.negative FROM campaign_criterion WHERE campaign.id = ${id} AND campaign_criterion.type = LOCATION AND campaign_criterion.status != 'REMOVED'`}))
    .filter(row=>!row.campaignCriterion?.negative).map(row=>row.campaignCriterion?.location?.geoTargetConstant).filter((value):value is string=>Boolean(value));
  if(criteria.length<15)throw Error('지정 지역이 충분히 확인되지 않았습니다. Google Ads에서 대상 지역을 먼저 점검해 주세요.');
  const resources=[...new Set(criteria)];
  const quoted=resources.map(value=>`'${value.replaceAll("'",'')}'`).join(',');
  const constants=rows(await api(token,path,{query:`SELECT geo_target_constant.resource_name, geo_target_constant.country_code, geo_target_constant.target_type, geo_target_constant.canonical_name FROM geo_target_constant WHERE geo_target_constant.resource_name IN (${quoted})`})).map(row=>row.geoTargetConstant);
  const allowed=/Bucheon|Bupyeong|Siheung|Ansan|Gunpo|Gwangmyeong|Anyang|Guro|Gangseo|Eunpyeong|Yangcheon|Yeongdeungpo|Dongjak|Geumcheon|Gwanak|Mapo|Seodaemun|Yongsan|부천|부평|시흥|안산|군포|광명|안양|구로|강서|은평|양천|영등포|동작|금천|관악|마포|서대문|용산/i;
  if(constants.length!==resources.length||constants.some(value=>!value||value.countryCode!=='KR'||!/^(City|District|Municipality)$/i.test(value.targetType||'')||!allowed.test(value.canonicalName||'')))throw Error('대상 지역에 지정 지역 외 지역이 포함되었거나 지역을 검증할 수 없습니다. Google Ads에서 확인해 주세요.');
}
export async function setCampaignStatus(token:Token,id:string,status:'ENABLED'|'PAUSED',expected:string){
  if(!/^\d+$/.test(id))throw Error('Google Ads 캠페인 ID를 확인해 주세요.');
  const list=await campaigns(token),campaign=list.find(c=>c.id===id);
  if(!campaign)throw Error('Google Ads 계정의 캠페인만 변경할 수 있습니다.');
  if(campaign.status!==expected)throw Error('광고 상태가 바뀌었습니다. 새로고침 후 다시 선택해 주세요.');
  if(status==='ENABLED'){
    if(campaign.channelType!=='SEARCH')throw Error('기존 실적 최대화 캠페인은 지역·전환 설정을 확인하기 전에는 관리자에서 켤 수 없습니다.');
    if(campaign.budget<=0||campaign.budget>100_000)throw Error('Google 하루예산이 10만 원 이하로 설정되어 있는지 확인해 주세요.');
    if(campaign.geoTargetType!=='PRESENCE')throw Error('Google 지역 옵션을 대상 지역에 실제 있는 사용자(PRESENCE)로 설정해 주세요.');
    await assertRegionalTargeting(token,id);
    if(list.some(other=>other.id!==id&&other.status==='ENABLED'))throw Error('다른 Google 캠페인이 이미 켜져 있습니다. 플랫폼 합계 예산을 확인해 주세요.');
  }
  const customer=process.env.GOOGLE_ADS_CUSTOMER_ID||CUSTOMER_ID;
  await api(token,`/customers/${customer}/campaigns:mutate`,{operations:[{update:{resourceName:`customers/${customer}/campaigns/${id}`,status},updateMask:'status'}]});
  const verified=(await campaigns(token)).find(c=>c.id===id);
  if(verified?.status!==status)throw Error('Google Ads 상태 변경을 아직 확인하지 못했습니다. 새로고침해 주세요.');
  return {id,status};
}
