"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./boiler-finder.module.css";

type Answers = {
  region: string;
  homeType: string;
  area: string;
  fuel: string;
  drain: string;
  controllers: string;
  extras: string[];
  timing: string;
  name: string;
  phone: string;
  consent: boolean;
};

const initialAnswers: Answers = { region: "", homeType: "", area: "", fuel: "", drain: "", controllers: "", extras: [], timing: "", name: "", phone: "", consent: false };
const extraOptions = [
  { name: "코어 타공", price: 100000, note: "구멍당", description: "벽에 새 연통 구멍을 뚫어야 할 때 필요합니다." },
  { name: "연통 연장", price: 10000, note: "m당", description: "보일러와 배기구 사이 거리가 길 때 추가합니다." },
  { name: "엘보 추가", price: 10000, note: "개당", description: "연통 방향을 꺾어 연결해야 할 때 사용하는 부속입니다." },
  { name: "감압변", price: 20000, note: "개당", description: "수압이 높은 현장에서 보일러를 보호하기 위해 설치합니다." },
  { name: "나비밸브", price: 20000, note: "개당", description: "난방 배관의 물 흐름을 열고 닫는 부속입니다." },
  { name: "볼밸브", price: 30000, note: "개당", description: "가스 또는 난방 배관 차단 밸브 교체가 필요할 때 추가합니다." },
  { name: "고소 작업", price: 50000, note: "현장 기준", description: "높은 외벽 작업에 사다리나 별도 장비가 필요할 때 발생합니다." },
  { name: "배관 청소", price: 50000, note: "현장 기준", description: "오래된 난방 배관의 이물질과 슬러지를 제거합니다." },
  { name: "후렉시블 교체", price: 50000, note: "현장 기준", description: "노후되거나 규격이 맞지 않는 연결관을 교체합니다." },
  { name: "노후 배관 교체", price: 0, note: "현장 확인", description: "누수·부식 상태와 교체 범위를 확인한 뒤 안내합니다." },
] as const;
const choiceSteps = [
  { key: "homeType", title: "어떤 공간에 설치하시나요?", hint: "건물 형태에 따라 배기와 설치 조건이 달라집니다.", choices: ["아파트", "빌라·오피스텔", "단독주택", "상가", "잘 모르겠어요"] },
  { key: "fuel", title: "사용 중인 연료는 무엇인가요?", hint: "가스계량기나 기존 보일러 표기를 확인해 주세요.", choices: ["도시가스(LNG)", "LPG", "잘 모르겠어요"] },
  { key: "drain", title: "보일러 3m 안에 배수구가 있나요?", hint: "배수구가 있으면 콘덴싱 보일러 설치 가능성을 확인할 수 있습니다.", choices: ["있어요", "없어요", "잘 모르겠어요"] },
  { key: "controllers", title: "온도조절기는 몇 개인가요?", hint: "방마다 조절기가 있다면 각방제어 호환 확인이 필요합니다.", choices: ["1개", "2~3개", "4개 이상", "잘 모르겠어요"] },
] as const;

function recommendation(areaText: string, drain: string) {
  const area = Number(areaText) || 0;
  const condensing = area <= 21 ? { capacity: "15K급", price: 750000 } : area <= 24 ? { capacity: "18K급", price: 800000 } : area <= 34 ? { capacity: "22K급", price: 900000 } : area <= 44 ? { capacity: "27K급", price: 950000 } : { capacity: "33K급", price: 1000000 };
  const general = area <= 21 ? { capacity: "15K급", price: 700000 } : area <= 30 ? { capacity: "20K급", price: 750000 } : { capacity: "25K급", price: 800000 };
  const selected = drain === "없어요" ? general : condensing;
  const type = drain === "있어요" ? "콘덴싱 보일러 우선 검토" : drain === "없어요" ? "일반형 또는 배수 공사 가능 여부 확인" : "일반형·콘덴싱 현장 확인";
  const price = drain === "잘 모르겠어요" ? `${general.price.toLocaleString("ko-KR")}~${condensing.price.toLocaleString("ko-KR")}원` : `${selected.price.toLocaleString("ko-KR")}원`;
  return { capacity: selected.capacity, type, price, basePrice: selected.price, minPrice: general.price, maxPrice: condensing.price, model: drain === "없어요" ? "일반형 NGB급" : "콘덴싱 NCB급" };
}

export default function BoilerFinder() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [submitted, setSubmitted] = useState(false);
  const result = useMemo(() => recommendation(answers.area, answers.drain), [answers.area, answers.drain]);
  const extraTotal = useMemo(() => extraOptions.filter((item) => answers.extras.includes(item.name)).reduce((sum, item) => sum + item.price, 0), [answers.extras]);
  const estimatedTotal = answers.drain === "잘 모르겠어요" ? `${(result.minPrice + extraTotal).toLocaleString("ko-KR")}~${(result.maxPrice + extraTotal).toLocaleString("ko-KR")}원` : `${(result.basePrice + extraTotal).toLocaleString("ko-KR")}원`;
  const totalSteps = 9;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const choose = (key: keyof Answers, value: string) => {
    setAnswers((current) => ({ ...current, [key]: value }));
    setTimeout(() => setStep((current) => Math.min(current + 1, totalSteps - 1)), 140);
  };

  const toggleExtra = (name: string) => setAnswers((current) => ({ ...current, extras: current.extras.includes(name) ? current.extras.filter((item) => item !== name) : [...current.extras, name] }));

  const submit = () => {
    if (!answers.name.trim() || !/^01[016789]-?\d{3,4}-?\d{4}$/.test(answers.phone) || !answers.consent) return;
    const lead = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), source: window.location.pathname, ...answers, recommendation: result };
    const saved = JSON.parse(localStorage.getItem("rocketboiler-leads") || "[]");
    localStorage.setItem("rocketboiler-leads", JSON.stringify([lead, ...saved].slice(0, 20)));
    setSubmitted(true);
  };

  const close = () => { setOpen(false); setTimeout(() => { setStep(0); setSubmitted(false); }, 250); };
  const progress = `${((step + 1) / totalSteps) * 100}%`;

  return <>
    <button className={styles.launcher} onClick={() => setOpen(true)} aria-haspopup="dialog"><span>30초</span><strong>나에게 맞는<br />보일러 찾기</strong><i>→</i></button>
    {open && <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <section className={styles.panel} role="dialog" aria-modal="true" aria-label="나에게 맞는 보일러 찾기">
        <header><button onClick={step ? () => setStep(step - 1) : close} aria-label={step ? "이전 질문" : "닫기"}>←</button><div><b>ROCKET MATCH</b><span>{step + 1} / {totalSteps}</span></div><button onClick={close} aria-label="닫기">×</button></header>
        <div className={styles.progress}><i style={{ width: progress }} /></div>
        <div className={styles.content}>
          {step === 0 && <Question title="어느 구에 설치하시나요?" hint="상세 주소는 필요하지 않아요. 구 이름만 적어주세요."><label className={styles.inputLabel}>설치 지역<input autoFocus value={answers.region} onChange={(e) => setAnswers({ ...answers, region: e.target.value })} placeholder="예: 송파구" /></label><Next disabled={!answers.region.trim()} onClick={() => setStep(1)} /></Question>}
          {step === 1 && <ChoiceQuestion data={choiceSteps[0]} value={answers.homeType} onChoose={choose} />}
          {step === 2 && <Question title="난방하는 공간은 몇 평인가요?" hint="공급면적 또는 대략적인 평수를 입력해도 괜찮습니다."><label className={styles.areaInput}><input inputMode="numeric" value={answers.area} onChange={(e) => setAnswers({ ...answers, area: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder="32" /><span>평</span></label><div className={styles.quick}>{["20", "24", "32", "40", "50"].map((v) => <button key={v} onClick={() => setAnswers({ ...answers, area: v })}>{v}평</button>)}</div><Next disabled={!answers.area} onClick={() => setStep(3)} /></Question>}
          {step === 3 && <ChoiceQuestion data={choiceSteps[1]} value={answers.fuel} onChoose={choose} />}
          {step === 4 && <ChoiceQuestion data={choiceSteps[2]} value={answers.drain} onChoose={choose} />}
          {step === 5 && <ChoiceQuestion data={choiceSteps[3]} value={answers.controllers} onChoose={choose} />}
          {step === 6 && <Question title="추가 작업이 예상되나요?" hint="현재 알고 있는 항목만 선택해 주세요. 잘 모르시면 선택 없이 넘어가도 됩니다."><div className={styles.extraNotice}><b>추가금은 언제 발생하나요?</b><p>기본 설치 범위를 벗어난 타공, 연통 연장, 부속 교체 등이 필요한 경우에만 발생합니다. 사진과 현장 확인 후 작업 전에 먼저 안내드립니다.</p></div><div className={styles.extras}>{extraOptions.map((item) => <button key={item.name} className={answers.extras.includes(item.name) ? styles.extraSelected : ""} onClick={() => toggleExtra(item.name)}><i>{answers.extras.includes(item.name) ? "✓" : ""}</i><span><b>{item.name}<small>{item.note}</small></b><p>{item.description}</p></span><em>{item.price ? `+${item.price.toLocaleString("ko-KR")}원` : "별도 견적"}</em></button>)}</div><div className={styles.extraSummary}><span>선택 항목 예상 추가금<small>수량과 현장 조건에 따라 달라질 수 있습니다.</small></span><strong>+{extraTotal.toLocaleString("ko-KR")}원</strong></div><Next disabled={false} onClick={() => setStep(7)} /></Question>}
          {step === 7 && <Question title="설치를 원하는 날짜가 언제인가요?" hint="달력에서 희망 설치일을 선택해 주세요."><label className={styles.dateInput}>희망 설치일<input type="date" min={new Date().toISOString().slice(0, 10)} value={answers.timing} onChange={(e) => setAnswers({ ...answers, timing: e.target.value })} /></label><Next disabled={!answers.timing} onClick={() => setStep(8)} /></Question>}
          {step === 8 && !submitted && <Question title="추천 결과가 나왔어요" hint="현장 사진 확인 후 정확한 모델과 설치 범위를 안내해 드립니다."><div className={styles.result}><span>예상 추천</span><strong>{result.capacity}</strong><b>{result.model} · {result.type}</b><div className={styles.price}><small>예상 기본가</small><em>{result.price}</em><i>제품·기본 설치 참고가</i></div>{answers.extras.length > 0 && <div className={styles.selectedExtras}><span>선택한 추가 작업</span><p>{answers.extras.join(" · ")}</p><b>예상 추가금 +{extraTotal.toLocaleString("ko-KR")}원</b></div>}<div className={styles.totalPrice}><span>예상 합계</span><strong>{estimatedTotal}</strong></div><ul><li>희망 설치일 {answers.timing}</li><li>각방제어기는 제조사와 통신·접점 방식 확인 필요</li><li>연통·배수구·각방제어 사진 확인 필요</li><li>수량·현장 조건에 따라 최종 가격이 달라질 수 있음</li></ul></div><div className={styles.contact}><label>이름<input value={answers.name} onChange={(e) => setAnswers({ ...answers, name: e.target.value })} placeholder="홍길동" /></label><label>휴대전화<input inputMode="tel" value={answers.phone} onChange={(e) => setAnswers({ ...answers, phone: e.target.value })} placeholder="010-0000-0000" /></label><label className={styles.consent}><input type="checkbox" checked={answers.consent} onChange={(e) => setAnswers({ ...answers, consent: e.target.checked })} /><span>상담을 위한 개인정보 수집·이용에 동의합니다.</span></label><button className={styles.submit} onClick={submit}>이 추천으로 상담 요청</button></div></Question>}
          {step === 8 && submitted && <div className={styles.done}><span>REQUEST SAVED</span><h2>상담 요청을<br />저장했습니다.</h2><p>입력하신 설치 조건과 추천 결과가 이 기기에 안전하게 보관되었습니다. DB 연결 후에는 담당자에게 자동 전달됩니다.</p><button onClick={close}>확인</button></div>}
        </div>
        <footer>제품과 설치 가능 여부는 현장 확인 후 최종 확정됩니다.</footer>
      </section>
    </div>}
  </>;
}

function Question({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) { return <div className={styles.question}><p>우리집 보일러 찾기</p><h2>{title}</h2><span>{hint}</span>{children}</div>; }
function Next({ disabled, onClick }: { disabled: boolean; onClick: () => void }) { return <button className={styles.next} disabled={disabled} onClick={onClick}>다음 질문</button>; }
function ChoiceQuestion({ data, value, onChoose }: { data: typeof choiceSteps[number]; value: string; onChoose: (key: keyof Answers, value: string) => void }) { return <Question title={data.title} hint={data.hint}><div className={styles.choices}>{data.choices.map((choice, index) => <button className={value === choice ? styles.selected : ""} key={choice} onClick={() => onChoose(data.key, choice)}><i>{String(index + 1).padStart(2, "0")}</i><span>{choice}</span><b>→</b></button>)}</div></Question>; }

