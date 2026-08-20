import type { Metadata } from "next";
import { notFound } from "next/navigation";

const regionData = {
  gangnam: { name: "강남구", towns: "역삼동·논현동·대치동·도곡동·삼성동·청담동·개포동·일원동·수서동" },
  seocho: { name: "서초구", towns: "서초동·방배동·잠원동·반포동·양재동·우면동·내곡동" },
  songpa: { name: "송파구", towns: "잠실동·가락동·문정동·석촌동·방이동·오금동·거여동·마천동" },
  gangdong: { name: "강동구", towns: "천호동·길동·성내동·둔촌동·암사동·명일동·고덕동·상일동" },
  mapo: { name: "마포구", towns: "공덕동·아현동·합정동·망원동·서교동·상암동·성산동·연남동" },
  gangseo: { name: "강서구", towns: "화곡동·가양동·등촌동·염창동·방화동·마곡동·공항동" },
  nowon: { name: "노원구", towns: "상계동·중계동·하계동·공릉동·월계동" },
  seongnam: { name: "성남시", towns: "분당구·수정구·중원구·정자동·야탑동·서현동·판교동·위례동" },
} as const;

type Slug = keyof typeof regionData;

export function generateStaticParams() { return Object.keys(regionData).map((slug) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const region = regionData[slug as Slug];
  if (!region) return {};
  const title = `${region.name} 보일러 교체·설치 비용 | 당일 방문 상담`;
  return {
    title,
    description: `${region.name} 경동나비엔·귀뚜라미 보일러 교체와 신규 설치. 사진으로 기본 설치 비용, 타공·연통 조건과 당일 방문 가능 여부를 확인하세요.`,
    alternates: { canonical: `/regions/${slug}` },
    keywords: [`${region.name} 보일러 설치`, `${region.name} 보일러 신규 설치`, `${region.name} 보일러 교체`, `${region.name} 보일러 설치 비용`],
    openGraph: { title, description: `${region.name} 보일러 교체 비용과 당일 방문 가능 여부를 사진으로 먼저 안내합니다.`, images: ["/og.png"] },
  };
}

export default async function RegionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const region = regionData[slug as Slug];
  if (!region) notFound();
  const nearby = Object.entries(regionData).filter(([key]) => key !== slug).slice(0, 4);
  const faq = [
    [`${region.name}도 당일 설치가 가능한가요?`, "오전에 사진과 주소를 보내주시면 제품 재고와 기사 일정을 확인해 당일 방문 가능 여부를 바로 알려드립니다."],
    ["신규 설치도 가능한가요?", "네. 새집과 상가, 인테리어 현장의 신규 설치와 이전 재설치도 가능합니다. 현장에 따라 연통 연장이나 타공 작업이 필요할 수 있어 배관과 연통 위치를 먼저 확인합니다."],
    ["설치 시간은 얼마나 걸리나요?", "평균 설치 시간은 약 1시간 30분~2시간입니다. 각방제어 추가 시 최대 3시간, 통신선과 배선 상태가 복잡하면 최대 4시간까지 소요될 수 있습니다."],
    ["사진으로 견적을 받을 수 있나요?", "보일러 공간과 모델명, 배관, 연통, 3m 이내 배수구 위치가 보이는 사진을 보내주세요. 각방제어 사용 시 각방제어기와 실내 온도조절기 전체 사진도 필요합니다."],
    ["기본 설치 외 추가 비용은 언제 생기나요?", "기본 설치 조건이면 별도 추가 비용은 없습니다. 연통 연장, 배관 이설, 타공 등 추가 작업이 필요하면 진행 전에 안내하며 코어 타공은 구멍 1개당 10만원입니다."],
  ];
  const schema = [
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) },
    { "@context": "https://schema.org", "@type": "Service", name: `${region.name} 보일러 교체·설치`, serviceType: "가정용 보일러 교체 및 신규 설치", areaServed: region.name, provider: { "@type": "HVACBusiness", name: "로켓보일러", url: "https://rocketboiler.vercel.app" } },
  ];

  return <main id="top">
    <div className="top-notice"><div><span>{region.name} 보일러 교체·설치</span><span>상담시간 09:00 - 21:00</span></div></div>
    <header className="site-header"><a className="brand" href="/"><span className="brand-symbol">R</span><span><b>로켓</b>보일러<small>가정용 보일러 설치·교체</small></span></a><nav><a href="#service">설치 안내</a><a href="#price">설치 비용</a><a href="#faq">자주 묻는 질문</a></nav><a className="header-button" href="#contact">견적 문의</a></header>
    <section className="region-hero">
      <div><p className="location-label">경동나비엔 · 귀뚜라미 · 신규 설치 · 교체</p><h1>{region.name} 보일러 교체,<br/><strong>비용과 일정을 먼저 확인하세요.</strong></h1><p>설치할 공간이나 현재 보일러 사진을 보내주시면 기본 설치 비용, 타공·연통 등 추가 작업 여부와 당일 방문 가능한 시간을 순서대로 알려드립니다.</p><div className="hero-buttons"><a className="primary-button" href="#contact">사진 견적 문의</a><a className="secondary-button" href="#price">비용 안내 보기</a></div></div>
      <aside><b>출장 가능 동네</b><p>{region.towns}</p><small>목록에 없는 동도 주소를 보내주시면 확인해 드립니다.</small></aside>
    </section>
    <section className="quick-benefits"><div><span>01</span><b>신규 보일러 설치</b><small>새집·상가·인테리어 현장을 확인합니다.</small></div><div><span>02</span><b>노후 보일러 교체</b><small>기존 제품 철거부터 설치까지 진행합니다.</small></div><div><span>03</span><b>이전·재설치</b><small>배관과 연통 조건을 먼저 확인합니다.</small></div></section>
    <section className="section service" id="service"><div className="section-heading"><span>{region.name} 보일러 설치</span><h2>신규 설치도, 교체도 현장 조건부터 정확히 봅니다.</h2><p>집의 평수와 온수 사용량, 설치 공간과 배관 상태에 맞춰 제품을 안내합니다.</p></div><div className="process-list"><article><span>01</span><div><h3>현장 사진·주소 접수</h3><p>설치 공간 또는 기존 제품과 출장 가능 시간을 확인합니다.</p></div></article><article><span>02</span><div><h3>제품·비용 안내</h3><p>용량과 브랜드별 선택지를 설명드립니다.</p></div></article><article><span>03</span><div><h3>방문 일정 확정</h3><p>가능한 시간과 예상 작업 시간을 약속합니다.</p></div></article><article><span>04</span><div><h3>설치·연결·점검</h3><p>제품 연결부터 난방과 온수 시운전까지 마칩니다.</p></div></article></div></section>
    <section className="section price" id="price"><div className="section-heading compact"><span>기본 설치 예상 비용</span><h2>설치 전, 대략적인 금액부터 확인하세요.</h2><p>브랜드·모델과 연통 및 배관 상태에 따라 실제 견적은 달라질 수 있습니다.</p></div><div className="price-table"><div className="table-head"><span>주거 면적</span><span>권장 용량</span><span>예상 비용</span></div><div><b>20평대</b><span>15,000 ~ 18,000 kcal</span><strong>60만원대부터</strong></div><div><b>30평대</b><span>18,000 ~ 22,000 kcal</span><strong>70만원대부터</strong></div><div><b>40평대 이상</b><span>25,000 kcal 이상</span><strong>맞춤 견적</strong></div><p>교체는 철거와 기본 설치 기준이며, 신규·이전 설치는 배관과 연통 조건 확인 후 안내합니다.</p></div></section>
    <section className="faq-section" id="faq"><div className="section faq"><div className="section-heading compact"><span>{region.name} 설치 문의</span><h2>자주 물어보시는 내용입니다.</h2></div><div className="faq-list">{faq.map(([q,a],i)=><details key={q} open={i===0}><summary><span>Q</span><b>{q}</b><i>＋</i></summary><p>{a}</p></details>)}</div></div></section>
    <section className="nearby"><h2>가까운 지역 보일러 설치 안내</h2><div>{nearby.map(([key, value])=><a key={key} href={`/regions/${key}`}>{value.name}<span>지역 안내 →</span></a>)}</div></section>
    <section className="contact" id="contact"><div><span>{region.name} 보일러 설치 상담</span><h2>설치할 자리나 현재 보일러를 찍어주세요.</h2><p>신규 현장은 설치 공간과 배관·연통 위치, 교체 현장은 제품 전체와 모델명 사진이 있으면 확인이 빠릅니다.</p></div><div className="contact-box"><p><b>접수할 때 함께 보내주세요</b><br/>설치 주소 · 연락 가능한 시간 · 설치 유형</p><a href={`mailto:hello@rocketboiler.kr?subject=${region.name} 보일러 설치 문의`}>사진 견적 문의 →</a></div></section>
    <footer><div className="footer-brand"><b>로켓보일러</b><span>{region.name} 가정용 보일러 교체·설치</span></div><div className="footer-links"><a href="/">홈</a><a href="#service">교체 안내</a><a href="#price">비용 안내</a><a href="#faq">자주 묻는 질문</a></div><p>로켓보일러 | 서울·경기·인천 가정용 보일러 교체·설치<br/>© 2026 로켓보일러. All rights reserved.</p></footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(schema)}} />
  </main>;
}

