import type { Metadata } from "next";
import Link from "next/link";
import { boilerGuides } from "./data";
import styles from "../regions/regions.module.css";

export const metadata:Metadata={title:"보일러 교체 비용·가격·용량 가이드",description:"보일러 교체 비용, 콘덴싱과 일반 보일러 차이, 평수별 용량과 아파트 설치 조건을 확인하세요.",alternates:{canonical:"/guides"}};
export default function GuidesPage(){return <main className={styles.shell}><nav className={styles.nav}><Link href="/" className={styles.brand}>ROCKET BOILER</Link><Link href="/brands" className={styles.navLink}>브랜드 비교</Link></nav><section className={styles.hubHero}><p className={styles.eyebrow}>BOILER BUYING GUIDE</p><h1>교체 전에 알아두면 좋은<br/><em>보일러 가격·설치 정보</em></h1><p>가격만 비교하기 전에 우리 집 용량, 배수구, 연통과 각방제어 조건을 확인하세요.</p></section><section className={styles.areaGroup}><div><span>핵심 안내</span><strong>{boilerGuides.length}개 가이드</strong></div><div className={styles.areaLinks}>{boilerGuides.map(guide=><Link href={`/guides/${guide.slug}`} key={guide.slug}><b>{guide.title}</b><small>비용·제품·설치 조건</small></Link>)}</div></section><section className={styles.cta}><p>우리 집 조건을 직접 확인하기 어려우신가요?</p><h2>사진을 보내주시면<br/>필요한 항목부터 안내합니다.</h2><Link href="/">설치 예약 시작</Link></section></main>}

