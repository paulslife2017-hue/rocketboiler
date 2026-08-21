import styles from "./guide-seo-details.module.css";

const priceRows = [
  ["원룸형", "60만원대부터", "75~80만원"],
  ["20평대", "65~70만원대부터", "80~85만원"],
  ["30평대", "70~75만원대부터", "85~90만원"],
  ["40평대", "75~80만원대부터", "90~95만원"],
  ["50평대", "80~85만원대부터", "95~100만원"],
];

const guideDetails: Record<string, { title: string; intro: string; checks: string[] }> = {
  "boiler-replacement-cost": {
    title: "보일러 교체 비용을 결정하는 조건",
    intro: "같은 평수라도 현재 모델과 설치 연도, 욕실 수, 연통과 배관 상태에 따라 필요한 용량과 작업 범위가 달라집니다.",
    checks: ["현재 보일러 모델과 설치 연도", "평수와 욕실 수", "연통·배관·배수구 사진"],
  },
  "gas-boiler-price-comparison": {
    title: "같은 조건으로 비교하는 브랜드 가격",
    intro: "귀뚜라미 기준 가격에서 린나이는 약 3만원, 경동나비엔은 약 5만원 높은 범위로 안내합니다. 같은 용량과 설치 조건으로 비교해야 정확합니다.",
    checks: ["브랜드보다 먼저 적정 용량 확인", "일반형과 콘덴싱을 같은 조건으로 비교", "설치 환경 사진으로 추가 작업 확인"],
  },
  "condensing-vs-general": {
    title: "콘덴싱과 일반형 선택 기준",
    intro: "콘덴싱 보일러는 응축수 배수가 필요합니다. 보일러에서 약 3m 안에 배수구가 있는지와 연료·배기 조건을 함께 확인합니다.",
    checks: ["3m 이내 배수구 유무", "도시가스(LNG) 또는 LPG", "FF 개인배기·FE 공동배기 확인"],
  },
  "apartment-boiler-replacement": {
    title: "아파트 교체 전 확인할 항목",
    intro: "계단식·복도식 구조, 연도 배기 방식, 각방제어기 유무를 확인하면 방문 전에 호환 부품과 작업 범위를 안내할 수 있습니다.",
    checks: ["계단식 또는 복도식", "FF 개인배기 또는 FE 공동배기", "각방제어기 브랜드와 개수"],
  },
  "city-gas-boiler": {
    title: "기본 설치에 포함되는 서비스",
    intro: "기본 설치, 배관 청소, 일산화탄소 감지기, 배상책임보험 가입과 도시가스 서류 대행을 기본 안내에 포함합니다.",
    checks: ["기본 설치와 배관 청소", "일산화탄소 감지기 설치", "보험 가입·도시가스 서류 대행"],
  },
};

export default function GuideSeoDetails({ slug }: { slug: string }) {
  const detail = guideDetails[slug];
  if (!detail) return null;
  return (
    <section className={styles.wrap} aria-labelledby="guide-detail-title">
      <div className={styles.heading}>
        <p>ROCKET BOILER GUIDE</p>
        <h2 id="guide-detail-title">{detail.title}</h2>
        <span>{detail.intro}</span>
      </div>
      <div className={styles.prices} aria-label="귀뚜라미 기준 보일러 예상 가격">
        {priceRows.map(([size, general, condensing]) => (
          <article key={size}>
            <b>{size}</b><span>일반 보일러</span><strong>{general}</strong>
            <span>1등급 친환경 콘덴싱</span><strong>{condensing}</strong>
          </article>
        ))}
      </div>
      <div className={styles.checks}>
        {detail.checks.map((item, index) => <div key={item}><i>0{index + 1}</i><span>{item}</span></div>)}
      </div>
      <p className={styles.note}>표시 가격은 귀뚜라미 기준의 제품·기본 설치 참고 범위입니다. 유료 추가 작업은 사진 또는 현장 확인 후 필요한 경우에만 진행하며, 작업 전에 비용을 먼저 안내합니다.</p>
    </section>
  );
}
