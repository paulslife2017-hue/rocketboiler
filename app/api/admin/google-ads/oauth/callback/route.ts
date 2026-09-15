import {NextRequest,NextResponse} from 'next/server';
import {database,initialize} from '../../../operations/store';
import {encryptToken,exchangeCode,validState} from '../../client';
export const runtime='nodejs';
export async function GET(r:NextRequest){const code=r.nextUrl.searchParams.get('code')||'',state=r.nextUrl.searchParams.get('state')||'';if(!code||!validState(state))return NextResponse.redirect(new URL('/admin?googleAds=invalid',r.url));try{const token=await exchangeCode(code);await initialize();const sql=database();await sql`INSERT INTO boiler_integrations(name,encrypted) VALUES('google_ads_oauth',${encryptToken(token)}) ON CONFLICT(name) DO UPDATE SET encrypted=EXCLUDED.encrypted,updated_at=NOW()`;return NextResponse.redirect(new URL('/admin?googleAds=connected',r.url));}catch{return NextResponse.redirect(new URL('/admin?googleAds=failed',r.url));}}
