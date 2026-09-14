import {createHmac,createHash,randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
export type Credentials={customerId:string;apiKey:string;secretKey:string};
export type Campaign={nccCampaignId:string;name:string;status:string;userLock:boolean;campaignTp:string};
export type Stats={impCnt:number;clkCnt:number;salesAmt:number};
export const SITE_HOST='rocketboiler.vercel.app';
export function isSiteUrl(value:unknown){if(typeof value!=='string'||!value)return false;try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)&&url.hostname===SITE_HOST&&!url.username&&!url.password;}catch{return false;}}
type Channel={nccBusinessChannelId:string;channelKey:string;statusReason?:string;businessInfo?:{site?:string}};
export type Group={nccAdgroupId:string;nccCampaignId:string;name:string;pcChannelId?:string;mobileChannelId?:string;status:string;statusReason:string;userLock:boolean;bidAmt?:number};
type Ad={ad?:{pc?:{final?:string};mobile?:{final?:string}}};
type Keyword={nccKeywordId:string;nccAdgroupId:string;keyword:string;status:string;userLock:boolean;delFlag:boolean;useGroupBidAmt:boolean;bidAmt:number};
const TARGET_POSITION=3,MAX_BID=3500,MIN_BID=70,MAX_STEP=500,MAX_RATIO=.2;
export async function siteGroups(c:Credentials){
  const [channels,groups]=await Promise.all([request(c,'/ncc/channels'),request(c,'/ncc/adgroups')]) as [Channel[],Group[]];
  if(!Array.isArray(channels)||!Array.isArray(groups))throw Error('네이버 연결 사이트를 확인할 수 없습니다.');
  const matching=channels.filter(ch=>isSiteUrl(ch.businessInfo?.site||ch.channelKey));const ids=new Set(matching.map(ch=>ch.nccBusinessChannelId));
  const candidates=groups.filter(g=>{const assigned=[g.pcChannelId,g.mobileChannelId].filter(Boolean);return assigned.length>0&&assigned.every(id=>ids.has(id!));});
  if(candidates.length>20)throw Error('네이버 사이트 광고그룹이 조회 한도를 초과했습니다.');
  const selected:Group[]=[];let mixed=0;
  for(const group of candidates){
    const [ads,keywords]=await Promise.all([request(c,'/ncc/ads',new URLSearchParams({nccAdgroupId:group.nccAdgroupId})),request(c,'/ncc/keywords',new URLSearchParams({nccAdgroupId:group.nccAdgroupId}))]);
    if(!Array.isArray(ads)||!Array.isArray(keywords))throw Error('네이버 광고 연결 URL을 확인할 수 없습니다.');
    const urls=(ads as Ad[]).flatMap(ad=>[ad.ad?.pc?.final,ad.ad?.mobile?.final]).filter(Boolean);
    const keywordUrls=keywords.flatMap((keyword:Record<string,unknown>)=>Object.entries(keyword).filter(([key,value])=>/url/i.test(key)&&typeof value==='string'&&value).map(([,value])=>value));
    if(urls.length&&[...urls,...keywordUrls].every(isSiteUrl))selected.push(group);else mixed++;
  }
  return {groups:selected,mixed,channelReasons:[...new Set(matching.map(ch=>ch.statusReason).filter(Boolean))]};
}
function key(){if(!process.env.DATABASE_URL)throw Error('서버 연결 설정을 확인해 주세요.');return createHash('sha256').update('naver-searchads:'+process.env.DATABASE_URL).digest();}
export function encrypt(c:Credentials){const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',key(),iv);const data=Buffer.concat([cipher.update(JSON.stringify(c)),cipher.final()]);return [iv,cipher.getAuthTag(),data].map(v=>v.toString('base64')).join('.');}
export function decrypt(value:string):Credentials{const [iv,tag,data]=value.split('.').map(v=>Buffer.from(v,'base64'));const cipher=createDecipheriv('aes-256-gcm',key(),iv);cipher.setAuthTag(tag);return JSON.parse(Buffer.concat([cipher.update(data),cipher.final()]).toString());}
export async function request(c:Credentials,path:string,params?:URLSearchParams){
  const timestamp=String(Date.now());const signature=createHmac('sha256',c.secretKey).update(`${timestamp}.GET.${path}`).digest('base64');
  const response=await fetch('https://api.searchad.naver.com'+path+(params?'?'+params:''),{headers:{'X-Timestamp':timestamp,'X-API-KEY':c.apiKey,'X-Customer':c.customerId,'X-Signature':signature},cache:'no-store',signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error(response.status===429?'네이버 조회 한도에 도달했습니다. 잠시 후 다시 조회해 주세요.':`네이버 검색광고 조회 실패 (${response.status}). API 권한과 연결 정보를 확인해 주세요.`);
  return response.json();
}
async function write(c:Credentials,method:'POST'|'PUT',path:string,body:unknown,fields?:string){
  const timestamp=String(Date.now());const signature=createHmac('sha256',c.secretKey).update(`${timestamp}.${method}.${path}`).digest('base64');const query=fields?'?fields='+encodeURIComponent(fields):'';
  const response=await fetch('https://api.searchad.naver.com'+path+query,{method,headers:{'content-type':'application/json; charset=UTF-8','X-Timestamp':timestamp,'X-API-KEY':c.apiKey,'X-Customer':c.customerId,'X-Signature':signature},body:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error(`네이버 입찰 설정 변경 실패 (${response.status}). 다시 조회해 주세요.`);return response.json();
}
export async function setGroupLock(c:Credentials,group:Record<string,unknown>,paused:boolean){
  const id=String(group.nccAdgroupId);if(!/^grp-[\w-]+$/.test(id))throw Error('네이버 광고그룹 ID를 확인해 주세요.');
  const path='/ncc/adgroups/'+id;const timestamp=String(Date.now());
  const signature=createHmac('sha256',c.secretKey).update(`${timestamp}.PUT.${path}`).digest('base64');
  const response=await fetch('https://api.searchad.naver.com'+path+'?fields=userLock',{method:'PUT',headers:{'content-type':'application/json; charset=UTF-8','X-Timestamp':timestamp,'X-API-KEY':c.apiKey,'X-Customer':c.customerId,'X-Signature':signature},body:JSON.stringify({...group,userLock:paused}),signal:AbortSignal.timeout(12000),cache:'no-store'});
  if(!response.ok)throw Error(`네이버 광고 설정 변경 실패 (${response.status}). 다시 조회해 주세요.`);
  const updated=await request(c,path);
  if(updated.userLock!==paused)throw Error('네이버 설정 반영을 아직 확인하지 못했습니다. 새로고침 후 상태를 확인해 주세요.');
  return {id,paused:updated.userLock,status:updated.status,statusReason:updated.statusReason};
}
export async function campaigns(c:Credentials):Promise<Campaign[]>{const data=await request(c,'/ncc/campaigns');if(!Array.isArray(data)||data.some(p=>typeof p.nccCampaignId!=='string'||typeof p.name!=='string'))throw Error('네이버 캠페인 응답을 확인할 수 없습니다.');return data;}
const rounded=(value:number)=>Math.max(MIN_BID,Math.min(MAX_BID,Math.ceil((Number(value)||MIN_BID)/10)*10));
export function nextSafeBid(currentValue:number,desiredValue:number){const current=rounded(currentValue),desired=rounded(desiredValue);if(desired>current){const ratio=Math.ceil(current*(1+MAX_RATIO)/10)*10;return Math.min(desired,current+MAX_STEP,ratio,MAX_BID);}if(current>desired*1.15)return Math.max(desired,Math.floor(current*.9/10)*10,MIN_BID);return current;}
export async function optimizeBids(c:Credentials,groups:Group[],dryRun=true){
  const active=groups.filter(g=>!g.userLock&&g.status!=='PAUSED');const keywords:(Keyword&{groupBid:number})[]=[];
  for(const group of active){const rows=await request(c,'/ncc/keywords',new URLSearchParams({nccAdgroupId:group.nccAdgroupId,recordSize:'1000'}));if(!Array.isArray(rows))throw Error('네이버 키워드 목록을 확인할 수 없습니다.');keywords.push(...rows.filter(k=>!k.delFlag&&k.status==='ELIGIBLE'&&!k.userLock&&k.keyword).map(k=>({...k,groupBid:Number(group.bidAmt)||MIN_BID})));}
  const estimates=new Map<string,number>();for(let i=0;i<keywords.length;i+=100){const batch=keywords.slice(i,i+100);const data=await write(c,'POST','/estimate/average-position-bid/keyword',{device:'MOBILE',items:batch.map(k=>({key:k.keyword,position:TARGET_POSITION}))});const rows=Array.isArray(data)?data:Array.isArray(data?.estimate)?data.estimate:[];for(const row of rows){const key=String(row.keyword||row.key||'').replace(/\s+/g,'').toLowerCase(),bid=Number(row.bid??row.bidAmt);if(key&&Number.isFinite(bid))estimates.set(key,rounded(bid));}}
  const plan=keywords.map(k=>{const estimated=estimates.get(k.keyword.replace(/\s+/g,'').toLowerCase());if(!estimated)return null;const current=rounded(k.useGroupBidAmt?k.groupBid:k.bidAmt),next=nextSafeBid(current,estimated);return {keywordId:k.nccKeywordId,adgroupId:k.nccAdgroupId,keyword:k.keyword,currentBid:current,estimatedBid:estimated,nextBid:next};}).filter((v):v is NonNullable<typeof v>=>Boolean(v));
  const targets=plan.filter(v=>v.currentBid!==v.nextBid);if(!dryRun){for(const item of targets)await write(c,'PUT','/ncc/keywords/'+item.keywordId,{nccAdgroupId:item.adgroupId,useGroupBidAmt:false,bidAmt:item.nextBid},'nccAdgroupId,useGroupBidAmt,bidAmt');}
  return {dryRun,targetPosition:TARGET_POSITION,maxBid:MAX_BID,totalKeywords:plan.length,targetCount:targets.length,changedCount:dryRun?0:targets.length,changes:targets.slice(0,100)};
}
export function statsOf(data:unknown):Stats{
  if(!data||typeof data!=='object'||!('data' in data)||!Array.isArray(data.data))throw Error('네이버 통계 응답을 확인할 수 없습니다.');
  return data.data.reduce((total:Stats,row:Record<string,unknown>)=>{for(const field of ['impCnt','clkCnt','salesAmt'] as const){if(typeof row[field]!=='number'||!Number.isFinite(row[field])||row[field]<0)throw Error('네이버 통계 항목이 누락되었습니다.');total[field]+=row[field];}return total;},{impCnt:0,clkCnt:0,salesAmt:0});
}
export function validPeriod(since:string,until:string){const valid=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;return valid(since)&&valid(until)&&since<=until&&(Date.parse(until)-Date.parse(since))/86400000<31;}
