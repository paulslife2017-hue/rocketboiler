import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceArea, serviceAreas } from "../data";
import styles from "../regions.module.css";
const siteUrl = "https://rocketboiler.vercel.app";
export function generateStaticParams(){ return serviceAreas.map(({slug})=>({slug})); }
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const area=getServiceArea((await params).slug); if(!area)return{}; const region=`${area.province} ${area.name}`;
  const title=`${region} 보일러 교체 비용·설치 가격`,description=`${region} 가스보일러 교체 비용과 설치 가격을 사진으로 확인하세요. 경동나비엔·귀뚜라미·린나이 보일러, 콘덴싱 보일러 설치 조건과 추가 비용을 미리 안내합니다.`;
  return{title,description,keywords:[`${region} 보일러`,`${region} 보일러 교체`,`${region} 보일러 설치`,`${region} 보일러 교체 비용`,`${region} 보일러 가격`,`${region} 가스보일러`],alternates:{canonical:`/regions/${area.slug}`},openGraph:{title:`${title} | 로켓보일러`,description,url:`/regions/${area.slug}`,images:["/og.png"]}};
}
export default async function RegionPage({params}:{params:Promise<{slug:string}>}){
  const area=getServiceArea((await params).slug); if(!area)notFound(); const region=`${area.province} ${area.name}`;
  const faq=[
    {q:`${area.name} 보일러 교체 비용은 어떻게 확인하나요?`,a:"보일러 모델과 용량, 연통, 배수구, 배관 상태에 따라 달라집니다. 현장 사진을 보내주시면 기본 설치 범위와 예상 추가 비용을 먼저 안내합니다."},
    {q:"사진만으로 견적을 받을 수 있나요?",a:"보일러 전체 공간, 기존 모델명, 배관과 연통, 3m 이내 배수구 위치를 촬영해 주세요. 각방제어를 사용하면 실내온도조절기와 각방제어기 사진도 필요합니다."},
    {q:"현장에서 추가 비용이 생길 수 있나요?",a:"기본 설치 범위를 벗어나 연통 연장, 밸브 교체, 배관 수정, 각방 통신변환기 등이 필요한 경우 추가될 수 있습니다. 사진과 현장 확인 후 작업 전에 비용을 먼저 안내합니다."},
    {q:"설치 시간은 얼마나 걸리나요?",a:"일반 교체는 평균 1시간 30분에서 2시간 정도이며, 각방제어 추가 시 최대 3시간, 통신선 정리가 필요하면 4시간가량 걸릴 수 있습니다."}
  ];
  const schema={"@context":"https://schema.org","@type":"Service",name:`${region} 보일러 교체·설치`,serviceType:"가정용 가스보일러 교체 및 신규 설치",provider:{"@type":"HVACBusiness",name:"로켓보일러",url:siteUrl,brand:["경동나비엔","귀뚜라미","린나이"]},areaServed:{"@type":"AdministrativeArea",name:region},url:`${siteUrl}/regions/${area.slug}`};
  const faqSchema={"@context":"https://schema.org","@type":"FAQPage",mainEntity:faq.map(x=>({"@type":"Question",name:x.q,acceptedAnswer:{"@type":"Answer",text:x.a}}))};
  return <main className={styles.shell}>
    <nav className={styles.nav}><Link href="/" className={styles.brand}>ROCKET BOILER</Link><Link href="/regions" className={styles.navLink}>전체 설치 지역</Link></nav>
    <section className={styles.hero}><p className={styles.eyebrow}>{region} 보일러 설치 전문</p><h1>{area.name} 보일러 교체 비용,<br/><em>사진으로 먼저 확인하세요</em></h1><p className={styles.lead}>경동나비엔·귀뚜라미·린나이 가스보일러 교체부터 신규 설치까지. 현장 조건과 예상 추가 비용을 설치 전에 안내합니다.</p><div className={styles.actions}><Link href="/" className={styles.primary}>사진 견적 요청</Link><a href="#cost" className={styles.secondary}>비용 기준 보기</a></div></section>
    <section className={styles.localStrip}><strong>방문 상담 지역</strong><span>{area.neighborhoods.join(" · ")} 및 {area.name} 전 지역</span></section>
    <section className={styles.section} id="cost"><p className={styles.kicker}>견적에서 확인할 항목</p><h2>제품 가격만큼 중요한<br/>현장 설치 조건</h2><div className={styles.grid}><article><b>01</b><h3>보일러 교체 비용</h3><p>기존 모델, 난방 평수, 용량과 배관 상태를 함께 확인해 알맞은 제품과 설치 범위를 안내합니다.</p></article><article><b>02</b><h3>연통·배수구 조건</h3><p>신규 설치나 위치 변경은 연통 연장과 타공이 필요할 수 있으며, 콘덴싱 보일러는 배수구 위치를 확인합니다.</p></article><article><b>03</b><h3>각방제어·통신선</h3><p>각방제어기와 실내조절기 사진을 확인해 작업 시간과 추가 자재 가능성을 미리 설명합니다.</p></article></div></section>
    <section className={styles.keywordBand}><p>많이 찾는 상담 항목</p><div>{[`${area.name} 보일러 교체`,`${area.name} 보일러 가격`,`${area.name} 보일러 설치`,"보일러 가격 비교","아파트 보일러 교체 비용","콘덴싱 보일러 교체"].map(k=><span key={k}>{k}</span>)}</div></section>
    <section className={styles.reviews} aria-labelledby="review-title"><div className={styles.reviewIntro}><p className={styles.kicker}>설치 고객 후기</p><h2 id="review-title">광고 문구보다<br/>실제 현장 기록</h2><p>고객 동의를 받은 {area.name} 설치 후기와 작업 사진을 순차적으로 등록합니다. 지역, 설치 제품, 작업 범위와 소요 시간을 확인할 수 있도록 투명하게 공개하겠습니다.</p></div><article className={styles.reviewPending}><span>VERIFIED REVIEW</span><h3>{area.name} 실제 설치 후기를 준비하고 있습니다.</h3><p>임의의 별점이나 가공한 고객 발언은 사용하지 않습니다. 카카오톡·네이버 등에서 확인된 후기만 개인정보를 가린 뒤 게시합니다.</p><ul><li>설치 지역과 제품명</li><li>실제 작업 내용과 소요 시간</li><li>고객 동의를 받은 후기와 현장 사진</li></ul></article></section>
    <section className={styles.section}><p className={styles.kicker}>자주 묻는 질문</p><h2>{area.name} 설치 전<br/>꼭 확인해 주세요</h2><div className={styles.faq}>{faq.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div></section>
    <section className={styles.cta}><p>{region} 보일러 교체를 준비 중이신가요?</p><h2>설치 사진을 보내주시면<br/>가능한 범위부터 안내합니다.</h2><Link href="/">로켓보일러 견적 확인</Link></section>
    <footer className={styles.footer}><Link href="/regions">서울·경기·인천 전체 지역 보기</Link><span>로켓보일러</span></footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqSchema)}}/>
  </main>;
}


