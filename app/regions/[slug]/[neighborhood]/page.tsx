import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceArea, serviceAreas } from "../../data";
import { boilerBrands } from "../../../brands/data";
import styles from "../../regions.module.css";

const siteUrl="https://rocketboiler.vercel.app";
export function generateStaticParams(){return serviceAreas.flatMap(area=>area.neighborhoods.map(neighborhood=>({slug:area.slug,neighborhood})));}
export async function generateMetadata({params}:{params:Promise<{slug:string;neighborhood:string}>}):Promise<Metadata>{const {slug,neighborhood}=await params;const area=getServiceArea(slug);if(!area||!area.neighborhoods.includes(neighborhood))return{};const title=`${neighborhood} 보일러 교체 비용·설치 가격`;const description=`${area.province} ${area.name} ${neighborhood} 가스보일러 교체 비용과 설치 가격을 확인하세요. 귀뚜라미·경동나비엔·린나이 보일러와 콘덴싱 제품을 사진으로 비교합니다.`;return{title,description,keywords:[`${neighborhood} 보일러`,`${neighborhood} 보일러 교체`,`${neighborhood} 보일러 설치`,`${neighborhood} 보일러 가격`,`${neighborhood} 보일러 교체 비용`,`${neighborhood} 귀뚜라미 보일러`,`${neighborhood} 경동나비엔 보일러`,`${neighborhood} 린나이 보일러`],alternates:{canonical:`/regions/${slug}/${neighborhood}`},openGraph:{title:`${title} | 로켓보일러`,description,url:`/regions/${slug}/${neighborhood}`,images:["/og.png"]}};}

export default async function NeighborhoodPage({params}:{params:Promise<{slug:string;neighborhood:string}>}){const {slug,neighborhood}=await params;const area=getServiceArea(slug);if(!area||!area.neighborhoods.includes(neighborhood))notFound();const region=`${area.province} ${area.name} ${neighborhood}`;const schema={"@context":"https://schema.org","@type":"Service",name:`${region} 보일러 교체·설치`,serviceType:"가정용 가스보일러 교체 및 신규 설치",provider:{"@type":"HVACBusiness",name:"로켓보일러",url:siteUrl},areaServed:{"@type":"AdministrativeArea",name:region},url:`${siteUrl}/regions/${slug}/${encodeURIComponent(neighborhood)}`};return <main className={styles.shell}>
  <nav className={styles.nav}><Link href="/" className={styles.brand}>ROCKET BOILER</Link><Link href={`/regions/${slug}`} className={styles.navLink}>{area.name} 전체</Link></nav>
  <section className={styles.hero}><p className={styles.eyebrow}>{region} 보일러 설치</p><h1>{neighborhood} 보일러 교체 비용,<br/><em>사진으로 먼저 비교하세요</em></h1><p className={styles.lead}>{neighborhood} 아파트·빌라·주택의 가스보일러 교체와 신규 설치 조건을 확인하고 브랜드별 예상 가격을 안내합니다.</p><div className={styles.actions}><Link href="/" className={styles.primary}>사진 견적·설치 예약</Link><a href="#brands" className={styles.secondary}>브랜드 비교</a></div></section>
  <section className={styles.localStrip}><strong>방문 상담</strong><span>{neighborhood} 및 {area.name} 서비스 지역</span></section>
  <section className={styles.section}><p className={styles.kicker}>교체 비용 확인</p><h2>{neighborhood} 보일러 설치 전<br/>사진으로 확인할 항목</h2><div className={styles.grid}><article><b>01</b><h3>평수와 온수 사용량</h3><p>난방 평수, 욕실 수와 동시 온수 사용량을 확인해 알맞은 용량을 비교합니다.</p></article><article><b>02</b><h3>연통과 배수구</h3><p>기존 연통 방식과 콘덴싱 보일러 배수 가능 여부를 사진으로 확인합니다.</p></article><article><b>03</b><h3>각방제어 호환</h3><p>각방제어기와 희망 보일러 브랜드의 통신 호환 조건을 확인합니다.</p></article></div></section>
  <section className={styles.areaGroup} id="brands"><div><span>{neighborhood} 브랜드 비교</span><strong>3개 브랜드</strong></div><div className={styles.areaLinks}>{boilerBrands.map(brand=><Link href={`/regions/${slug}/brands/${brand.slug}`} key={brand.slug}><b>{neighborhood} {brand.name} 보일러</b><small>교체 가격·설치 조건</small></Link>)}</div></section>
  <section className={styles.keywordBand}><p>{neighborhood} 보일러 관련 검색</p><div>{[`${neighborhood} 보일러 교체`,`${neighborhood} 보일러 설치`,`${neighborhood} 보일러 가격`,`${neighborhood} 보일러 교체 비용`,`${neighborhood} 콘덴싱 보일러`,`${neighborhood} 가스보일러`].map(k=><span key={k}>{k}</span>)}</div></section>
  <section className={styles.cta}><p>{neighborhood} 보일러 교체를 준비 중이신가요?</p><h2>오른쪽 아래 설치 예약에서<br/>사진과 희망 날짜를 남겨주세요.</h2><Link href="/">설치 예약 시작</Link></section>
  <footer className={styles.footer}><Link href={`/regions/${slug}`}>{area.name} 보일러</Link><Link href="/brands">브랜드 비교</Link><Link href="/guides">교체 가이드</Link><span>로켓보일러</span></footer>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/>
</main>}

