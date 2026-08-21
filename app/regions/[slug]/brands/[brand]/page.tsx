import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceArea, serviceAreas } from "../../../data";
import { boilerBrands, getBoilerBrand } from "../../../../brands/data";
import styles from "../../../regions.module.css";

const siteUrl="https://rocketboiler.vercel.app";
export function generateStaticParams(){return serviceAreas.flatMap(area=>boilerBrands.map(brand=>({slug:area.slug,brand:brand.slug})));}
export async function generateMetadata({params}:{params:Promise<{slug:string;brand:string}>}):Promise<Metadata>{const {slug,brand:brandSlug}=await params;const area=getServiceArea(slug),brand=getBoilerBrand(brandSlug);if(!area||!brand)return{};const region=`${area.province} ${area.name}`;const title=`${area.name} ${brand.name} 보일러 교체 가격·설치`;const description=`${region} ${brand.name} 가스보일러 교체 가격과 콘덴싱 설치 조건을 확인하세요. ${area.neighborhoods.join("·")} 등 ${area.name} 사진 견적을 안내합니다.`;return{title,description,robots:{index:false,follow:true},keywords:[`${area.name} ${brand.name} 보일러`,`${area.name} ${brand.name} 보일러 교체`,`${area.name} ${brand.name} 보일러 가격`,`${area.name} ${brand.name} 콘덴싱 보일러`,...area.neighborhoods.map(n=>`${n} ${brand.name} 보일러`)],alternates:{canonical:`/regions/${slug}/brands/${brandSlug}`}};}

export default async function RegionBrandPage({params}:{params:Promise<{slug:string;brand:string}>}){const {slug,brand:brandSlug}=await params;const area=getServiceArea(slug),brand=getBoilerBrand(brandSlug);if(!area||!brand)notFound();const region=`${area.province} ${area.name}`;const schema={"@context":"https://schema.org","@type":"Service",name:`${area.name} ${brand.name} 보일러 교체·설치`,serviceType:`${brand.name} 가스보일러 교체 및 설치`,provider:{"@type":"HVACBusiness",name:"로켓보일러",url:siteUrl},areaServed:{"@type":"AdministrativeArea",name:region},url:`${siteUrl}/regions/${slug}/brands/${brandSlug}`};return <main className={styles.shell}>
  <nav className={styles.nav}><Link href="/" className={styles.brand}>ROCKET BOILER</Link><Link href={`/regions/${slug}`} className={styles.navLink}>{area.name} 전체</Link></nav>
  <section className={styles.hero}><p className={styles.eyebrow}>{region} {brand.name} 보일러</p><h1>{area.name} {brand.name} 보일러,<br/><em>교체 가격과 설치 조건</em></h1><p className={styles.lead}>{brand.headline}. {area.name} 현장 사진으로 용량, 연통, 배수구와 각방제어 조건을 확인합니다.</p><div className={styles.actions}><Link href="/" className={styles.primary}>사진 견적·설치 예약</Link><a href="#price" className={styles.secondary}>가격 기준 보기</a></div></section>
  <section className={styles.localStrip}><strong>{area.name} {brand.name} 예상 가격</strong><span>{brand.priceNote}</span></section>
  <section className={styles.section} id="price"><p className={styles.kicker}>브랜드 설치 기준</p><h2>{area.name}에서 {brand.name}<br/>보일러를 선택할 때</h2><div className={styles.grid}>{brand.strengths.map((item,index)=><article key={item}><b>{String(index+1).padStart(2,"0")}</b><h3>{item}</h3><p>{area.neighborhoods.join("·")} 등 {area.name} 현장의 기존 모델과 설치 사진을 확인해 제품과 기본 설치 범위를 안내합니다.</p></article>)}</div></section>
  <section className={styles.keywordBand}><p>{area.name} {brand.name} 관련 검색</p><div>{[`${area.name} ${brand.name} 보일러`,`${area.name} ${brand.name} 보일러 교체`,`${area.name} ${brand.name} 보일러 가격`,...area.neighborhoods.map(n=>`${n} ${brand.name} 보일러`)].map(k=><span key={k}>{k}</span>)}</div></section>
  <section className={styles.cta}><p>{area.name} {brand.name} 보일러 상담이 필요하신가요?</p><h2>사진으로 설치 조건부터<br/>간단하게 확인하세요.</h2><Link href="/">설치 예약 시작</Link></section>
  <footer className={styles.footer}><Link href={`/regions/${slug}`}>{area.name} 보일러</Link><Link href={`/brands/${brandSlug}`}>{brand.name} 안내</Link><Link href="/guides">교체 가이드</Link><span>로켓보일러</span></footer>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/>
</main>}

