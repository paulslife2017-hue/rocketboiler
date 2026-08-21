import type { Metadata } from "next";
import Link from "next/link";
import { serviceAreas } from "./data";
import styles from "./regions.module.css";
export const metadata:Metadata={title:"서울·경기 9개 시·인천 보일러 교체·설치 지역",description:"서울 25개 구, 군포·안양·과천·광명·부천·고양·구리·하남·성남과 인천 8개 구의 보일러 교체 비용, 설치 가격과 사진 견적 정보를 확인하세요. 영종도·강화군 등 도서 지역은 제외됩니다.",alternates:{canonical:"/regions"}};
export default function RegionsPage(){return <main className={styles.shell}><nav className={styles.nav}><Link href="/" className={styles.brand}>ROCKET BOILER</Link><Link href="/" className={styles.navLink}>홈으로</Link></nav><section className={styles.hubHero}><p className={styles.eyebrow}>{serviceAreas.length} SERVICE AREAS</p><h1>가까운 지역의<br/><em>보일러 설치 정보</em></h1><p>서울 전 지역과 경기 9개 시, 인천 8개 구의 보일러 교체 비용과 설치 조건을 확인하세요. 영종도·강화군 등 도서 지역은 방문에서 제외됩니다.</p></section>{(["서울","경기","인천"] as const).map(p=><section className={styles.areaGroup} key={p}><div><span>{p}</span><strong>{serviceAreas.filter(a=>a.province===p).length}개 지역</strong></div><div className={styles.areaLinks}>{serviceAreas.filter(a=>a.province===p).map(a=><Link href={`/regions/${a.slug}`} key={a.slug}><b>{a.name}</b><small>교체 비용·설치 가격</small></Link>)}</div></section>)}<section className={styles.cta}><p>우리 동네 보일러 교체 비용이 궁금하신가요?</p><h2>사진으로 현장 조건부터<br/>빠르게 확인하세요.</h2><Link href="/">사진 견적 요청</Link></section></main>}

