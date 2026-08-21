import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { boilerBrands, getBoilerBrand } from "../data";
import styles from "../../regions/regions.module.css";

export function generateStaticParams(){return boilerBrands.map(({slug})=>({slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const brand=getBoilerBrand((await params).slug);if(!brand)return{};return{title:`${brand.name} 보일러 교체 가격·콘덴싱 설치`,description:`${brand.name} 가스보일러 교체 가격, 일반형·콘덴싱 차이와 평수별 용량을 사진 견적으로 확인하세요.`,keywords:brand.keywords,alternates:{canonical:`/brands/${brand.slug}`}};}

export default async function BrandPage({params}:{params:Promise<{slug:string}>}){const brand=getBoilerBrand((await params).slug);if(!brand)notFound();return <main className={styles.shell}>
  <nav className={styles.nav}><Link href="/" className={styles.brand}>ROCKET BOILER</Link><Link href="/brands" className={styles.navLink}>브랜드 비교</Link></nav>
  <section className={styles.hero}><p className={styles.eyebrow}>{brand.name} BOILER</p><h1>{brand.name} 보일러 교체,<br/><em>가격과 설치 조건을 함께</em></h1><p className={styles.lead}>{brand.headline}. {brand.description}</p><div className={styles.actions}><Link href="/" className={styles.primary}>사진 견적·설치 예약</Link><a href="#price" className={styles.secondary}>가격 기준 보기</a></div></section>
  <section className={styles.localStrip}><strong>{brand.name} 예상 가격</strong><span>{brand.priceNote}</span></section>
  <section className={styles.section} id="price"><p className={styles.kicker}>브랜드 선택 기준</p><h2>{brand.name} 보일러를<br/>비교할 때 확인할 것</h2><div className={styles.grid}>{brand.strengths.map((item,index)=><article key={item}><b>{String(index+1).padStart(2,"0")}</b><h3>{item}</h3><p>기존 모델명과 보일러 공간, 배관, 연통, 배수구 사진을 확인한 뒤 필요한 제품과 기본 설치 범위를 안내합니다.</p></article>)}</div></section>
  <section className={styles.keywordBand}><p>{brand.name} 보일러 관련 검색</p><div>{brand.keywords.map(keyword=><span key={keyword}>{keyword}</span>)}</div></section>
  <section className={styles.section}><p className={styles.kicker}>가격 안내</p><h2>같은 평수라도<br/>용량이 달라질 수 있습니다</h2><div className={styles.faq}><details open><summary>{brand.name} 보일러 가격은 왜 범위로 표시하나요?</summary><p>욕실 두 곳에서 온수를 동시에 사용하거나 단열이 약한 집, 필로티 구조는 한 단계 높은 용량이 필요할 수 있습니다. 사진 확인 후 적정 용량과 예상 범위를 안내합니다.</p></details><details><summary>기본 설치에 무엇이 포함되나요?</summary><p>기본 설치, 배관 청소, 일산화탄소 감지기, 배상책임보험 가입과 도시가스 서류 접수 대행을 안내합니다. 현장 추가 작업은 진행 전에 설명드립니다.</p></details></div></section>
  <section className={styles.cta}><p>{brand.name} 보일러 교체를 준비 중이신가요?</p><h2>사진으로 설치 조건부터<br/>간단하게 확인하세요.</h2><Link href="/">설치 예약 시작</Link></section>
  <footer className={styles.footer}><Link href="/brands">브랜드 전체 보기</Link><Link href="/guides">교체 가이드</Link><Link href="/regions">설치 지역</Link><span>로켓보일러</span></footer>
</main>}

