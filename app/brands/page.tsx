import type { Metadata } from "next";
import Link from "next/link";
import { boilerBrands } from "./data";
import styles from "../regions/regions.module.css";

export const metadata: Metadata = {
  title: "경동나비엔·귀뚜라미·린나이 보일러 가격 비교",
  description: "경동나비엔, 귀뚜라미, 린나이 가스보일러 교체 가격과 콘덴싱 제품, 평수별 용량 선택 기준을 비교하세요.",
  alternates: { canonical: "/brands" }
};

export default function BrandsPage(){return <main className={styles.shell}>
  <nav className={styles.nav}><Link href="/" className={styles.brand}>ROCKET BOILER</Link><Link href="/regions" className={styles.navLink}>설치 지역</Link></nav>
  <section className={styles.hubHero}><p className={styles.eyebrow}>BOILER BRAND GUIDE</p><h1>우리 집에 맞는<br/><em>보일러 브랜드 비교</em></h1><p>브랜드 이름만 보고 고르기보다 난방 평수, 욕실 수, 온수 사용량과 기존 설치 조건을 함께 확인하세요.</p></section>
  <section className={styles.areaGroup}><div><span>취급 브랜드</span><strong>3개 브랜드</strong></div><div className={styles.areaLinks}>{boilerBrands.map(brand=><Link href={`/brands/${brand.slug}`} key={brand.slug}><b>{brand.name} 보일러</b><small>교체 가격·콘덴싱 비교</small></Link>)}</div></section>
  <section className={styles.cta}><p>브랜드 선택이 어려우신가요?</p><h2>기존 보일러 사진으로<br/>호환 조건부터 확인하세요.</h2><Link href="/">설치 예약 시작</Link></section>
</main>}

