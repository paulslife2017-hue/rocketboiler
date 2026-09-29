import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getServiceArea, serviceAreas } from "../data";
import SeoKeywordLinks from "../../components/SeoKeywordLinks";
import styles from "../regions.module.css";
const siteUrl = "https://rocketboiler.vercel.app";
export function generateStaticParams(){ return serviceAreas.map(({slug})=>({slug})); }
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const area=getServiceArea((await params).slug); if(!area)return{}; const areaKeyword=area.province==="경기"?area.name.replace(/시$/,""):area.name; const region=`${area.province} ${areaKeyword}`;
  const title=`${area.province==="경기"?areaKeyword:region} 보일러 교체·설치 비용`,description=`${area.province} ${area.name} ${area.neighborhoods.join("·")} 보일러 교체·신규 설치 상담. 경동나비엔·귀뚜라미·린나이 제품과 연통·배수구 등 현장별 추가 비용을 전화로 확인하세요.`;
  const localKeywords=area.neighborhoods.flatMap(n=>[`${n} 보일러 교체`,`${n} 보일러 설치`,`${n} 보일러 가격`]);
  return{title,description,keywords:[`${region} 보일러`,`${region} 보일러 교체`,`${region} 보일러 설치`,`${region} 보일러 교체 비용`,`${region} 보일러 가격`,`${region} 가스보일러`,`${area.name} 경동나비엔 보일러`,`${area.name} 귀뚜라미 보일러`,`${area.name} 린나이 보일러`,...localKeywords],alternates:{canonical:`/regions/${area.slug}`},openGraph:{title:`${title} | 로켓보일러`,description,url:`/regions/${area.slug}`,images:["/og.png"]}};
}
export default async function RegionPage({params}:{params:Promise<{slug:string}>}){
  const area=getServiceArea((await params).slug); if(!area)notFound(); const areaKeyword=area.province==="경기"?area.name.replace(/시$/,""):area.name; const region=`${area.province} ${areaKeyword}`;
  const faq=[
    {q:`${area.name} 보일러 교체 비용은 어떻게 확인하나요?`,a:"보일러 모델과 용량, 연통, 배수구, 배관 상태에 따라 달라집니다. 현장 사진을 보내주시면 기본 설치 범위와 예상 추가 비용을 먼저 안내합니다."},
    {q:"사진만으로 견적을 받을 수 있나요?",a:"보일러 전체 공간, 기존 모델명, 배관과 연통, 3m 이내 배수구 위치를 촬영해 주세요. 각방제어를 사용하면 실내온도조절기와 각방제어기 사진도 필요합니다."},
    {q:"현장에서 추가 비용이 생길 수 있나요?",a:"기본 설치 범위를 벗어나 연통 연장, 밸브 교체, 배관 수정, 각방 통신변환기 등이 필요한 경우 추가될 수 있습니다. 사진과 현장 확인 후 작업 전에 비용을 먼저 안내합니다."},
    {q:"설치 시간은 얼마나 걸리나요?",a:"일반 교체는 평균 1시간 30분에서 2시간 정도이며, 각방제어 추가 시 최대 3시간, 통신선 정리가 필요하면 4시간가량 걸릴 수 있습니다."}
  ];
  const schema={"@context":"https://schema.org","@type":"Service",name:`${region} 보일러 교체·설치`,serviceType:"가정용 가스보일러 교체 및 신규 설치",provider:{"@type":"HVACBusiness",name:"로켓보일러",url:siteUrl,brand:["경동나비엔","귀뚜라미","린나이"]},areaServed:{"@type":"AdministrativeArea",name:region},url:`${siteUrl}/regions/${area.slug}`};
  const breadcrumbSchema={"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"로켓보일러",item:siteUrl},{"@type":"ListItem",position:2,name:"설치 지역",item:`${siteUrl}/regions`},{"@type":"ListItem",position:3,name:`${region} 보일러 교체·설치`,item:`${siteUrl}/regions/${area.slug}`}]};
  const faqSchema={"@context":"https://schema.org","@type":"FAQPage",mainEntity:faq.map(x=>({"@type":"Question",name:x.q,acceptedAnswer:{"@type":"Answer",text:x.a}}))};
  return <main className={styles.shell}>
    <nav className={styles.nav}><Link href="/" className={styles.brand}>ROCKET BOILER</Link><Link href="/regions" className={styles.navLink}>전체 설치 지역</Link></nav>
    <section className={styles.hero}><p className={styles.eyebrow}>{region} 보일러 설치 전문</p><h1>{areaKeyword} 보일러 교체·설치 비용,<br/><em>전화로 바로 상담하세요</em></h1><p className={styles.lead}>경동나비엔·귀뚜라미·린나이 가스보일러 교체부터 신규 설치까지. 현장 조건과 예상 추가 비용을 설치 전에 안내합니다.</p><div className={styles.actions}><a href="tel:01058589975" className={styles.primary}>전화로 바로 상담</a><a href="#cost" className={styles.secondary}>비용 기준 보기</a></div></section>
    <section className={styles.localStrip}><strong>방문 상담 지역</strong><span>{area.neighborhoods.join(" · ")} 및 {area.name} 전 지역</span></section>
    <section className={styles.section} id="cost"><p className={styles.kicker}>견적에서 확인할 항목</p><h2>제품 가격만큼 중요한<br/>현장 설치 조건</h2><div className={styles.grid}><article><b>01</b><h3>보일러 교체 비용</h3><p>기존 모델, 난방 평수, 용량과 배관 상태를 함께 확인해 알맞은 제품과 설치 범위를 안내합니다.</p></article><article><b>02</b><h3>연통·배수구 조건</h3><p>신규 설치나 위치 변경은 연통 연장과 타공이 필요할 수 있으며, 콘덴싱 보일러는 배수구 위치를 확인합니다.</p></article><article><b>03</b><h3>각방제어·통신선</h3><p>각방제어기와 실내조절기 사진을 확인해 작업 시간과 추가 자재 가능성을 미리 설명합니다.</p></article></div></section>
    <section className={styles.keywordBand}><p>{area.name} 보일러 교체 관련 안내</p><SeoKeywordLinks areaSlug={area.slug} areaName={area.name} neighborhoods={area.neighborhoods}/></section>
    <section className={styles.section}><p className={styles.kicker}>동네별 사진 견적</p><h2>{area.neighborhoods.join("·")}<br/>보일러 교체 안내</h2><div className={styles.grid}>{area.neighborhoods.map((n,index)=><article key={n}><b>{String(index+1).padStart(2,"0")}</b><h3><Link href={`/regions/${area.slug}/${n}`}>{n} 보일러 교체·설치</Link></h3><p>{n} 아파트·빌라·주택의 기존 보일러 모델, 난방 평수, 연통과 배수구 사진을 확인해 귀뚜라미·경동나비엔·린나이 제품과 예상 설치 범위를 안내합니다.</p></article>)}</div></section>
    <section className={styles.areaGroup}><div><span>{area.name} 브랜드별 안내</span><strong>3개 브랜드</strong></div><div className={styles.areaLinks}>{[{slug:"kiturami",name:"귀뚜라미"},{slug:"kyungdong-navien",name:"경동나비엔"},{slug:"rinnai",name:"린나이"}].map(brand=><Link href={`/regions/${area.slug}/brands/${brand.slug}`} key={brand.slug}><b>{area.name} {brand.name} 보일러</b><small>교체 가격·콘덴싱 설치</small></Link>)}</div></section>
    <section className={`${styles.section} ${styles.fieldStory}`}>
      <div className={styles.fieldIntro}>
        <p className={styles.kicker}>실제 작업 현장</p>
        <h2>사진보다 중요한 건,<br/>작업 전 설명입니다</h2>
        <p className={styles.fieldLead}>기존 보일러와 설치 공간을 먼저 확인하고, 제품 용량과 기본 설치 범위, 추가 작업 가능성을 안내합니다. 현장에서 필요한 작업이 달라질 때는 이유와 비용을 먼저 설명한 뒤 진행합니다.</p>
        <ul className={styles.trustList}>
          <li><b>설치 전</b><span>기존 모델·평수·연통·배수구·각방제어 확인</span></li>
          <li><b>작업 전</b><span>기본 설치 범위와 추가 비용 가능성 사전 안내</span></li>
          <li><b>설치 후</b><span>난방·온수 작동과 배관 연결 상태 점검</span></li>
        </ul>
        <div className={styles.fieldActions}>
          <a href="tel:01058589975" className={styles.primary}>010-5858-9975 전화 상담</a>
          <a href="#consultation" data-consultation-trigger className={styles.secondary}>사진으로 문의 남기기</a>
        </div>
        <a className={styles.photoSource} href="https://map.naver.com/p/entry/place/2092135363" target="_blank" rel="noopener noreferrer">네이버 플레이스에서 업체 정보 확인 ↗</a>
      </div>
      <div className={styles.photoGrid}>
        <figure><Image src="/field-photos/naver-1.jpg" alt="보일러 설치 공간과 연통 배치 확인 현장" width={955} height={1280}/><figcaption><b>설치 공간 확인</b><span>보일러 위치와 연통·배기 조건을 함께 봅니다.</span></figcaption></figure>
        <figure><Image src="/field-photos/naver-7.jpg" alt="가스보일러 하부 배관 연결 상태 확인 현장" width={969} height={1280}/><figcaption><b>배관 연결 확인</b><span>난방·온수·가스 배관과 밸브 상태를 점검합니다.</span></figcaption></figure>
      </div>
    </section>
    <section className={styles.section}><p className={styles.kicker}>자주 묻는 질문</p><h2>{area.name} 설치 전<br/>꼭 확인해 주세요</h2><div className={styles.faq}>{faq.map(x=><details key={x.q}><summary>{x.q}</summary><p>{x.a}</p></details>)}</div></section>
    <section className={styles.cta}><p>{region} 보일러 교체를 준비 중이신가요?</p><h2>현장 조건과 설치 비용을<br/>전화로 바로 확인하세요.</h2><a href="tel:01058589975">010-5858-9975 전화 상담</a></section>
    <footer className={styles.footer}><Link href="/regions">전체 설치 지역</Link><Link href="/brands">브랜드별 보일러</Link><Link href="/guides">교체·가격 안내</Link><span>로켓보일러</span></footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqSchema)}}/><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(breadcrumbSchema)}}/>
  </main>;
}


