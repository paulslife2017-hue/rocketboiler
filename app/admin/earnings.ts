import { profitCatalog } from './profit';
import { recommendation } from '../website-pricing';

export const DEFAULT_LABOR = 80000;
export type Price = {sku:string;cost:number|null;cost_source:string};
export type Sale = {id:string;channel:'web'|'naver';date:string;model:string;sku:string|null;quantity:number;amount:number|null;status:'sold'|'pending'|'cancelled'|'linked';note:string;cost:number|null;labor:number;profit:number|null};
export const amountOf=(v:unknown):number|null=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0?v:null;
const normalize=(s:string)=>s.toUpperCase().replace(/[^A-Z0-9]/g,'');
export function matchSku(code:string, text:string):string|null {
  const exact=profitCatalog.find(p=>p.sku===code);if(exact)return exact.sku;
  // Match a complete series + capacity, never capacity alone or ambiguous multi-model listings.
  const compact=text.toUpperCase();
  const found=profitCatalog.filter(p=>{const model=normalize(p.model.replace(/트윈 |ECO /g,''));return new RegExp('(?<![A-Z0-9])'+model.split('').join('[\\s-]*')+'(?![A-Z0-9])').test(compact);});
  return found.length===1?found[0].sku:null;
}
export function websiteQuote(sku:string) {
  const p=profitCatalog.find(p=>p.sku===sku);if(!p)return null;
  const cap=Number(p.model.match(/-(\d+)/)?.[1]);
  const general=/NGB|L11|R331/.test(sku);
  const areas:Record<number,number>=general?{15:21,20:30,25:40}:{13:15,15:21,18:24,22:34,27:44,33:54};
  if(!areas[cap])return null;
  const quote=recommendation(String(areas[cap]),general?'없어요':'있어요',p.brand,'1개','','','');
  return {min:quote.minPrice,max:quote.maxPrice};
}
export function calculateSale(sale:Omit<Sale,'profit'>):Sale {
  return {...sale,profit:sale.status==='sold'&&sale.amount!==null&&sale.cost!==null?sale.amount-(sale.cost+sale.labor)*sale.quantity:null};
}
export function totalsOf(rows:Sale[]) {
  const sold=rows.filter(r=>r.status==='sold');
  return {count:sold.length,revenue:sold.reduce((n,r)=>n+(r.amount??0),0),profit:sold.reduce((n,r)=>n+(r.profit??0),0),missing:sold.filter(r=>r.profit===null).length,pending:rows.filter(r=>r.status==='pending').length};
}
