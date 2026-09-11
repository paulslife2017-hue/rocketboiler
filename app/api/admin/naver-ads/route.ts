import {NextRequest,NextResponse} from 'next/server';
import {database,initialize} from '../operations/store';
import {campaigns,setGroupLock,siteGroups,SITE_HOST,decrypt,encrypt,request as adsRequest,statsOf,validPeriod,type Credentials} from './client';
import {channelOf,koreaDate} from '../../../admin/shared';
export const runtime='nodejs';
export const maxDuration=60;
const authorized=(r:NextRequest)=>Boolean(process.env.ADMIN_PASSWORD&&r.headers.get('authorization')===`Bearer ${process.env.ADMIN_PASSWORD}`);
function failure(e:unknown){const message=e instanceof Error&&e.message.startsWith('네이버')?e.message:'광고 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';return NextResponse.json({error:message},{status:502});}
export async function GET(r:NextRequest){
  if(!authorized(r))return NextResponse.json({error:'관리자 로그인이 필요합니다.'},{status:401});
  const until=r.nextUrl.searchParams.get('until')||koreaDate();const since=r.nextUrl.searchParams.get('since')||koreaDate(new Date(Date.now()-6*86400000));
  if(!validPeriod(since,until)||until>koreaDate())return NextResponse.json({error:'오늘까지 최대 31일 범위로 선택해 주세요.'},{status:400});
  try{await initialize();const sql=database();const rows=await sql`SELECT encrypted FROM boiler_integrations WHERE name='naver_searchads'`;if(!rows.length)return NextResponse.json({connected:false},{headers:{'Cache-Control':'private, no-store'}});
    const c=decrypt(rows[0].encrypted);const scope=await siteGroups(c);const list=scope.groups;
    const results=[];const start=Date.now();
    for(let i=0;i<list.length;i+=4){if(Date.now()-start>35000)throw Error('네이버 조회 시간이 초과됐습니다. 다시 조회해 주세요.');const batch=await Promise.all(list.slice(i,i+4).map(async campaign=>{const params=new URLSearchParams({id:campaign.nccAdgroupId,fields:JSON.stringify(['impCnt','clkCnt','salesAmt']),timeRange:JSON.stringify({since,until}),timeIncrement:'allDays'});const stats=statsOf(await adsRequest(c,'/stats',params));return {id:campaign.nccAdgroupId,name:campaign.name,status:campaign.status,paused:campaign.userLock,statusReason:campaign.statusReason,type:'AD_GROUP',...stats};}));results.push(...batch);}
    const totals=results.reduce((a,b)=>({impCnt:a.impCnt+b.impCnt,clkCnt:a.clkCnt+b.clkCnt,salesAmt:a.salesAmt+b.salesAmt}),{impCnt:0,clkCnt:0,salesAmt:0});
    const sources=await sql`SELECT source,status,COUNT(*)::int AS count FROM boiler_leads WHERE status!='sample' AND created_at>=${since+'T00:00:00+09:00'}::timestamptz AND created_at<${until+'T00:00:00+09:00'}::timestamptz+INTERVAL '1 day' GROUP BY source,status`;
    const leads={naver:0,google:0,unknown:0,naverCompleted:0};for(const row of sources){const ch=channelOf(row.source||'');leads[ch as 'naver'|'google'|'unknown']+=Number(row.count);if(ch==='naver'&&row.status==='completed')leads.naverCompleted+=Number(row.count);}
    return NextResponse.json({connected:true,customerId:c.customerId,siteHost:SITE_HOST,excludedMixed:scope.mixed,channelReasons:scope.channelReasons,since,until,campaigns:results,totals,leads,updatedAt:new Date().toISOString()},{headers:{'Cache-Control':'private, no-store'}});
  }catch(e){return failure(e);}
}
export async function POST(r:NextRequest){
  if(!authorized(r))return NextResponse.json({error:'관리자 로그인이 필요합니다.'},{status:401});
  try{const b=await r.json();
    if(b.action==='toggle'){
      if(typeof b.id!=='string'||!/^grp-[\w-]+$/.test(b.id)||typeof b.paused!=='boolean'||typeof b.expectedPaused!=='boolean')return NextResponse.json({error:'광고그룹과 ON/OFF 설정을 확인해 주세요.'},{status:400});
      await initialize();const sql=database();const stored=await sql`SELECT encrypted FROM boiler_integrations WHERE name='naver_searchads'`;if(!stored.length)return NextResponse.json({error:'광고 계정 연결이 필요합니다.'},{status:409});
      const c=decrypt(stored[0].encrypted);const scope=await siteGroups(c);
      if(!scope.groups.some(g=>g.nccAdgroupId===b.id))return NextResponse.json({error:'로켓보일러 사이트에 연결된 광고그룹만 변경할 수 있습니다.'},{status:403});
      const group=await adsRequest(c,'/ncc/adgroups/'+b.id);
      if(group.userLock!==b.expectedPaused)return NextResponse.json({error:'광고 설정이 변경됐습니다. 새로 조회한 뒤 다시 선택해 주세요.'},{status:409});
      const result=await setGroupLock(c,group,b.paused);return NextResponse.json({ok:true,...result});
    }
    if(typeof b.customerId!=='string'||!/^\d{1,20}$/.test(b.customerId)||typeof b.apiKey!=='string'||b.apiKey.length<10||b.apiKey.length>300||typeof b.secretKey!=='string'||b.secretKey.length<10||b.secretKey.length>300)return NextResponse.json({error:'광고 계정과 인증 정보를 확인해 주세요.'},{status:400});
    const c:Credentials={customerId:b.customerId,apiKey:b.apiKey.trim(),secretKey:b.secretKey.trim()};const list=await campaigns(c);await initialize();const sql=database();await sql`INSERT INTO boiler_integrations(name,encrypted) VALUES('naver_searchads',${encrypt(c)}) ON CONFLICT(name) DO UPDATE SET encrypted=EXCLUDED.encrypted,updated_at=NOW()`;return NextResponse.json({ok:true,customerId:c.customerId,campaignCount:list.length});
  }catch(e){return failure(e);}
}
