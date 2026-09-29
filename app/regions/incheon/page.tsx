import type { Metadata } from "next";
import Link from "next/link";
import { serviceAreas } from "../data";
import styles from "../regions.module.css";

const districts = serviceAreas.filter((area) => area.province === "인천");

export const metadata: Metadata = {
  title: "인천 보일러 교체비용·설치비용 | 영종·강화 제외",
  description: "인천 보일러 교체·설치 상담. 부평·미추홀·연수·남동·계양·서구와 중구 본토·동구를 방문하며 영종도·강화군은 제외합니다. 기본 설치 예상 가격과 추가 작업 기준을 확인하세요.",
  alternates: { canonical: "/regions/incheon" },
  openGraph: {
    title: "인천 보일러 교체비용·설치비용 | 로켓보일러",
    description: "인천 8개 구의 가정용 가스보일러 교체·설치 조건을 안내합니다. 영종도·강화군 제외.",
    url: "/regions/incheon",
  },
};

export default function IncheonPage() {
  return <main className={styles.shell}>
    <nav className={styles.nav}><Link href="/" className={styles.brand}>ROCKET BOILER</Link><Link href="/regions" className={styles.navLink}>전체 설치 지역</Link></nav>
    <section className={styles.hero}>
      <p className={styles.eyebrow}>인천 가정용 가스보일러 교체·설치</p>
      <h1>인천 보일러 교체비용,<br/><em>설치 조건까지 확인하세요</em></h1>
      <p className={styles.lead}>귀뚜라미 일반형 원룸·기본 설치 기준 60만원대부터. 린나이·경동나비엔과 콘덴싱 모델은 용량, 연통·배관·배수구 상태에 따라 견적이 달라집니다. 강화군·영종도는 방문 지역에서 제외됩니다.</p>
      <div className={styles.actions}><a href="tel:01058589975" className={styles.primary}>010-5858-9975 전화 상담</a><a href="#districts" className={styles.secondary}>방문 지역 보기</a></div>
    </section>
    <section className={styles.section} id="districts">
      <p className={styles.kicker}>인천 방문 가능 지역</p>
      <h2>구별 보일러 교체·설치 안내</h2>
      <p className={styles.costIntro}>아래 지역에서 보일러 교체 상담이 가능합니다. 인천 중구는 영종도 등 도서 지역을 제외한 본토 지역만 방문합니다. 주소를 알려주시면 방문 가능 일정과 설치 조건을 확인해 드립니다.</p>
      <div className={styles.areaLinks}>{districts.map((area)=><Link href={`/regions/${area.slug}`} key={area.slug}><b>인천 {area.name} 보일러 교체</b><small>{area.neighborhoods.join("·")} · 비용 안내</small></Link>)}</div>
    </section>
    <section className={styles.section}>
      <p className={styles.kicker}>설치비 확인 기준</p>
      <h2>제품 가격과 추가 작업을<br/>따로 확인하세요</h2>
      <div className={styles.grid}>
        <article><b>01</b><h3>보일러 용량·브랜드</h3><p>난방 평수와 욕실 수, 기존 모델을 알려주시면 귀뚜라미·린나이·경동나비엔 동급 제품의 예상 가격을 비교합니다.</p></article>
        <article><b>02</b><h3>연통·배관·배수구</h3><p>기본 설치 범위에서 벗어나는 연통 연장, 배관 수정, 타공이나 콘덴싱 배수 작업이 필요한지 확인합니다.</p></article>
        <article><b>03</b><h3>방문 일정</h3><p>인천 내 주소와 접수 시간을 기준으로 재고·기사 일정을 확인하고 가능한 방문 시간을 안내합니다.</p></article>
      </div>
      <Link className={styles.costLink} href="/guides/boiler-replacement-cost">평수별 예상 가격표와 추가 설치비 기준 보기 →</Link>
    </section>
    <section className={styles.cta}><p>인천 보일러 교체를 준비 중이신가요?</p><h2>주소와 기존 모델을 알려주시면<br/>예상 비용을 안내합니다.</h2><a href="tel:01058589975">010-5858-9975 전화 상담</a></section>
    <footer className={styles.footer}><Link href="/regions">전체 지역</Link><Link href="/guides/boiler-replacement-cost">교체 비용</Link><Link href="/brands">브랜드 비교</Link><span>로켓보일러</span></footer>
  </main>;
}
