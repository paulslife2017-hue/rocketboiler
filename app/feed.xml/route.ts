import { boilerGuides } from "../guides/data";

const siteUrl="https://rocketboiler.vercel.app";
const esc=(value:string)=>value.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");

export function GET(){
  const items=boilerGuides.map(guide=>({
    title:guide.title,
    url:`${siteUrl}/guides/${guide.slug}`,
    description:[guide.headline,guide.description,...guide.points.map(point=>`${point.title}: ${point.text}`)].join(" ")
  }));
  const xml=`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>로켓보일러 보일러 교체·설치 가이드</title><link>${siteUrl}</link><description>보일러 교체와 설치 조건을 설명하는 로켓보일러 가이드</description><language>ko</language>${items.map(item=>`<item><title>${esc(item.title)}</title><link>${item.url}</link><guid isPermaLink="true">${item.url}</guid><description>${esc(item.description)}</description></item>`).join("")}</channel></rss>`;
  return new Response(xml,{headers:{"Content-Type":"application/rss+xml; charset=utf-8","Cache-Control":"public, max-age=3600, s-maxage=3600"}});
}

