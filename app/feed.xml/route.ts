import { boilerBrands } from "../brands/data";
import { boilerGuides } from "../guides/data";
import { serviceAreas } from "../regions/data";

const siteUrl="https://rocketboiler.vercel.app";
const esc=(value:string)=>value.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");

export function GET(){
  const updated=new Date().toUTCString();
  const items=[
    ...boilerGuides.map(guide=>({title:guide.title,url:`${siteUrl}/guides/${guide.slug}`,description:guide.description})),
    ...boilerBrands.map(brand=>({title:`${brand.name} 보일러 교체 가격`,url:`${siteUrl}/brands/${brand.slug}`,description:brand.description})),
    ...serviceAreas.map(area=>({title:`${area.province} ${area.name} 보일러 교체 비용`,url:`${siteUrl}/regions/${area.slug}`,description:`${area.neighborhoods.join("·")} 등 ${area.name} 보일러 교체·설치와 브랜드별 가격 안내`}))
  ];
  const xml=`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>로켓보일러 교체·설치 정보</title><link>${siteUrl}</link><description>서울·경기·인천 보일러 교체 비용, 브랜드 가격과 설치 정보</description><language>ko</language><lastBuildDate>${updated}</lastBuildDate>${items.map(item=>`<item><title>${esc(item.title)}</title><link>${item.url}</link><guid isPermaLink="true">${item.url}</guid><pubDate>${updated}</pubDate><description>${esc(item.description)}</description></item>`).join("")}</channel></rss>`;
  return new Response(xml,{headers:{"Content-Type":"application/rss+xml; charset=utf-8","Cache-Control":"public, max-age=3600, s-maxage=3600"}});
}

