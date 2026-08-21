const faqs = [
  ["오늘 연락하면 당일 설치가 가능한가요?", "오전에 접수하시고 제품 재고와 기사 일정이 맞으면 당일 설치가 가능합니다. 주소와 현장 사진을 확인한 뒤 방문 가능한 시간을 알려드립니다."],
  ["새집이나 상가에 신규 설치도 가능한가요?", "네. 신규 설치와 인테리어 후 재설치도 가능합니다. 현장 상황에 따라 연통 연장뿐 아니라 타공 작업이 필요할 수 있어, 배관·연통 위치를 사진이나 현장 방문으로 먼저 확인한 뒤 필요한 작업을 안내드립니다."],
  ["보일러 설치 시간은 얼마나 걸리나요?", "평균 설치 시간은 약 1시간 30분~2시간입니다. 각방제어기 추가 작업이 있으면 최대 3시간, 통신선 상태가 복잡하거나 배선 정리가 필요하면 최대 4시간까지 소요될 수 있습니다."],
  ["사진으로 먼저 견적을 받을 수 있나요?", "네. 사진으로 거의 확정적인 견적 안내가 가능합니다. 보일러 전체 공간과 모델명, 배관, 연통, 배수구 위치가 보이도록 촬영해 주세요. 보일러에서 3m 이내에 배수구가 있는지 확인할 수 있어야 하며, 각방제어를 사용 중이면 각방제어기와 실내 온도조절기 전체 사진도 함께 보내주세요."],
  ["현장에서 추가 비용이 생길 수도 있나요?", "기본 설치 조건이면 별도 추가 비용은 없습니다. 다만 현장에서 연통 연장, 배관 이설, 타공 등 추가 작업이 필요한 경우 비용이 발생할 수 있습니다. 사진 또는 현장 확인 후 필요한 작업과 비용을 진행 전에 먼저 안내드립니다."],
  ["어떤 브랜드를 설치하나요?", "경동나비엔, 귀뚜라미, 린나이 보일러를 취급합니다. 집의 평수와 온수 사용량, 기존 설치 조건에 맞는 제품을 안내해 드립니다."],
];

const areas = [
  ["강남구", "/regions/gangnam"],
  ["서초구", "/regions/seocho"],
  ["송파구", "/regions/songpa"],
  ["강동구", "/regions/gangdong"],
  ["마포구", "/regions/mapo"],
  ["강서구", "/regions/gangseo"],
  ["노원구", "/regions/nowon"],
  ["성남시", "/regions/seongnam"],
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(([name, text]) => ({
    "@type": "Question",
    name,
    acceptedAnswer: { "@type": "Answer", text },
  })),
};

export default function Home() {
  return (
    <main id="top">
      <div className="top-notice">
        <div><span>서울·경기 보일러 설치 전문</span><span>상담시간 09:00 - 21:00</span></div>
      </div>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="로켓보일러 홈">
          <span className="brand-symbol">R</span>
          <span><b>로켓</b>보일러<small>가정용 보일러 교체·설치</small></span>
        </a>
        <nav aria-label="주요 메뉴">
          <a href="#service">서비스 안내</a>
          <a href="#price">설치 비용</a>
          <a href="#area">출장 지역</a>
          <a href="#faq">자주 묻는 질문</a>
        </nav>
        <a className="header-button" href="#contact">상담 문의</a>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="location-label">신규 설치 · 교체 설치 · 이전 설치</p>
          <h1>보일러 설치가 필요할 때<br /><strong>오늘 바로 확인합니다.</strong></h1>
          <p className="lead">신규 설치부터 노후 보일러 교체까지 가능합니다. 현장 사진을 보내주시면 설치비와 방문 일정을 먼저 안내합니다.</p>
          <div className="hero-buttons">
            <a className="primary-button" href="#contact">사진으로 견적 받기</a>
            <a className="secondary-button" href="#price">설치비 먼저 보기</a>
          </div>
          <p className="hero-note">※ 오전 상담 시 당일 설치 일정을 우선 확인해 드립니다.</p>
        </div>

        <figure className="hero-photo">
          <img src="/hero-installation.png" alt="가정집 보일러 배관을 점검하고 있는 설치 기사" width="1536" height="1024" fetchPriority="high" />
        </figure>
      </section>

      <section className="quick-benefits" aria-label="기본 서비스">
        <div><span>01</span><b>신규 보일러 설치</b><small>새집·상가·인테리어 현장을 확인합니다.</small></div>
        <div><span>02</span><b>노후 보일러 교체</b><small>기존 제품 철거부터 설치까지 진행합니다.</small></div>
        <div><span>03</span><b>이전·재설치</b><small>배관과 연통 조건을 먼저 확인합니다.</small></div>
      </section>

      <section className="section service" id="service">
        <div className="section-heading">
          <span>보일러 설치 진행 순서</span>
          <h2>신규 설치와 교체, 모두 같은 순서로 확인합니다.</h2>
          <p>설치할 공간이나 기존 보일러를 사진으로 확인한 뒤 제품과 비용, 방문 시간을 안내합니다.</p>
        </div>
        <div className="process-list">
          <article><span>01</span><div><h3>현장 사진과 주소 확인</h3><p>설치 공간이나 기존 보일러, 배관 사진과 주소를 확인합니다.</p></div></article>
          <article><span>02</span><div><h3>제품과 비용 안내</h3><p>집의 평수와 사용량에 맞는 제품, 예상 비용을 알려드립니다.</p></div></article>
          <article><span>03</span><div><h3>방문 일정 확정</h3><p>재고와 기사 일정을 확인하고 가능한 방문 시간을 약속드립니다.</p></div></article>
          <article><span>04</span><div><h3>설치·연결·점검</h3><p>필요한 경우 기존 제품을 철거하고 새 제품 연결과 시운전까지 마칩니다.</p></div></article>
        </div>
      </section>

      <section className="promise-wrap">
        <div className="promise">
          <div><span>설치할 때 확인하는 것</span><h2>어떤 현장이든 설치 조건부터 정확히 봅니다.</h2></div>
          <ul>
            <li><b>01</b><span><strong>용량 확인</strong>평수와 온수 사용량, 기존 배관을 보고 제품을 정합니다.</span></li>
            <li><b>02</b><span><strong>추가 작업 확인</strong>배관이나 연통 보완이 필요하면 설치 전에 말씀드립니다.</span></li>
            <li><b>03</b><span><strong>설치 후 점검</strong>난방·온수 작동과 가스·배관 연결 상태를 확인합니다.</span></li>
          </ul>
        </div>
      </section>

      <section className="section price" id="price">
        <div className="section-heading compact">
          <span>보일러 설치 비용</span>
          <h2>보일러 설치 예상 비용입니다.</h2>
          <p>아래 금액은 기본 설치를 기준으로 한 상담용 예상 금액입니다. 브랜드와 모델, 배관·연통 상태에 따라 달라질 수 있습니다.</p>
        </div>
        <div className="price-tables">
          <article className="price-card">
            <div><span>귀뚜라미 기준</span><h3>일반 보일러</h3></div>
            {[["원룸형","60만원대부터"],["20평대","65~70만원대부터"],["30평대","70~75만원대부터"],["40평대","75~80만원대부터"],["50평대","80~85만원대부터"]].map(([area,cost])=><p key={area}><b>{area}</b><strong>{cost}</strong></p>)}
          </article>
          <article className="price-card eco">
            <div><span>1등급 친환경</span><h3>콘덴싱 보일러</h3></div>
            {[["원룸형","75~80만원"],["20평대","80~85만원"],["30평대","85~90만원"],["40평대","90~95만원"],["50평대","95~100만원"],["60평대","100~105만원"]].map(([area,cost])=><p key={area}><b>{area}</b><strong>{cost}</strong></p>)}
          </article>
          <div className="price-guide"><b>브랜드별 가격 안내</b><span>귀뚜라미 기준 · 린나이 동급 모델 약 3만원 추가 · 경동나비엔 동급 모델 약 5만원 추가</span><small>기본 설치 범위의 상담용 예상가입니다. 사진과 현장 확인 결과에 따라 필요한 옵션이 추가되거나 제외될 수 있으며, 작업 전에 먼저 안내합니다.</small></div>
        </div>
      </section>

      <section className="brands">
        <div><span>취급 브랜드</span><strong>경동나비엔</strong><strong>귀뚜라미</strong><strong>린나이</strong></div>
      </section>

      <section className="section area" id="area">
        <div className="section-heading compact">
          <span>출장 가능 지역</span>
          <h2>서울·경기·인천 방문 가능합니다.</h2>
          <p>지역과 접수 시간, 기사 배정 상황에 따라 당일 방문 여부가 달라질 수 있습니다.</p>
        </div>
        <div className="area-list">
          {areas.map(([name, href]) => <a href={href} key={name}><span className="pin">●</span><b>{name} 보일러 설치</b><em>지역 안내 →</em></a>)}
          <p>목록에 없는 지역도 상담 시 주소를 알려주시면 확인해 드립니다.</p>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="section faq">
          <div className="section-heading compact"><span>자주 묻는 질문</span><h2>보일러 설치 문의 안내</h2></div>
          <div className="faq-list">
            {faqs.map(([q, a], index) => (
              <details key={q} open={index === 0}>
                <summary><span>Q</span><b>{q}</b><i>＋</i></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="contact" id="contact">
        <div>
          <span>보일러 설치 상담</span>
          <h2>설치할 자리나 현재 보일러를 찍어주세요.</h2>
          <p>신규 현장은 설치 공간과 배관·연통 위치, 교체 현장은 제품 전체와 모델명 사진을 준비해 주세요.</p>
        </div>
        <div className="contact-box">
          <p><b>사진 상담 안내</b><br />설치 주소와 연락 가능한 시간도 함께 적어주시면 확인이 빠릅니다.</p>
        </div>
      </section>

      <footer>
        <div className="footer-brand"><b>로켓보일러</b><span>서울·경기 가정용 보일러 교체·설치</span></div>
        <div className="footer-links"><a href="#service">서비스 안내</a><a href="#price">비용 안내</a><a href="#area">출장 지역</a><a href="#faq">자주 묻는 질문</a></div>
        <p>로켓보일러 | 서울·경기·인천 가정용 보일러 교체·설치<br />© 2026 로켓보일러. All rights reserved.</p>
      </footer>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
    </main>
  );
}

