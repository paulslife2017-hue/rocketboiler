import {createHmac,createHash,randomBytes,createCipheriv,createDecipheriv} from 'node:crypto';
export type Credentials={customerId:string;apiKey:string;secretKey:string};
export type Campaign={nccCampaignId:string;name:string;status:string;userLock:boolean;campaignTp:string};
export type Stats={impCnt:number;clkCnt:number;salesAmt:number};
export const SITE_HOST='rocketboiler.vercel.app';
export function isSiteUrl(value:unknown){if(typeof value!=='string'||!value)return false;try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)&&url.hostname===SITE_HOST&&!url.username&&!url.password;}catch{return false;}}
type Channel={nccBusinessChannelId:string;channelKey:string;statusReason?:string;businessInfo?:{site?:string}};
type Group={nccAdgroupId:string;nccCampaignId:string;name:string;pcChannelId?:string;mobileChannelId?:string;status:string;statusReason:string;userLock:boolean};
type Ad={ad?:{pc?:{final?:string};mobile?:{final?:string}}};
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
export function statsOf(data:unknown):Stats{
  if(!data||typeof data!=='object'||!('data' in data)||!Array.isArray(data.data))throw Error('네이버 통계 응답을 확인할 수 없습니다.');
  return data.data.reduce((total:Stats,row:Record<string,unknown>)=>{for(const field of ['impCnt','clkCnt','salesAmt'] as const){if(typeof row[field]!=='number'||!Number.isFinite(row[field])||row[field]<0)throw Error('네이버 통계 항목이 누락되었습니다.');total[field]+=row[field];}return total;},{impCnt:0,clkCnt:0,salesAmt:0});
}
export function validPeriod(since:string,until:string){const valid=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;return valid(since)&&valid(until)&&since<=until&&(Date.parse(until)-Date.parse(since))/86400000<31;}
