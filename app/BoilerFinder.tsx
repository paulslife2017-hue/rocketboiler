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
  timing: string;
  name: string;
  phone: string;
  consent: boolean;
};

const initialAnswers: Answers = { region: "", homeType: "", area: "", fuel: "", drain: "", controllers: "", timing: "", name: "", phone: "", consent: false };
const choiceSteps = [
  { key: "homeType", title: "어떤 공간에 설치하시나요?", hint: "건물 형태에 따라 배기와 설치 조건이 달라집니다.", choices: ["아파트", "빌라·오피스텔", "단독주택", "상가", "잘 모르겠어요"] },
  { key: "fuel", title: "사용 중인 연료는 무엇인가요?", hint: "가스계량기나 기존 보일러 표기를 확인해 주세요.", choices: ["도시가스(LNG)", "LPG", "잘 모르겠어요"] },
  { key: "drain", title: "보일러 3m 안에 배수구가 있나요?", hint: "배수구가 있으면 콘덴싱 보일러 설치 가능성을 확인할 수 있습니다.", choices: ["있어요", "없어요", "잘 모르겠어요"] },
  { key: "controllers", title: "온도조절기는 몇 개인가요?", hint: "방마다 조절기가 있다면 각방제어 호환 확인이 필요합니다.", choices: ["1개", "2~3개", "4개 이상", "잘 모르겠어요"] },
  { key: "timing", title: "언제 설치를 원하시나요?", hint: "희망 일정에 맞춰 방문 가능 여부를 확인해 드립니다.", choices: ["최대한 빠르게", "3일 이내", "1주일 이내", "날짜 상담"] },
] as const;

function recommendation(areaText: string, drain: string) {
  const area = Number(areaText) || 0;
  const capacity = area <= 21 ? "15K급" : area <= 24 ? "18K급" : area <= 34 ? "22K급" : area <= 44 ? "27K급" : "33K급";
  const type = drain === "있어요" ? "콘덴싱 보일러 우선 검토" : drain === "없어요" ? "일반형 또는 배수 공사 가능 여부 확인" : "일반형·콘덴싱 현장 확인";
  return { capacity, type };
}

export default function BoilerFinder() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [submitted, setSubmitted] = useState(false);
  const result = useMemo(() => recommendation(answers.area, answers.drain), [answers.area, answers.drain]);
  const totalSteps = 8;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const choose = (key: keyof Answers, value: string) => {
    setAnswers((current) => ({ ...current, [key]: value }));
    setTimeout(() => setStep((current) => Math.min(current + 1, totalSteps - 1)), 140);
  };

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
          {step === 0 && <Question title="어느 지역에 설치하시나요?" hint="동까지 적어주시면 방문 가능 여부를 빠르게 확인할 수 있어요."><label className={styles.inputLabel}>설치 지역<input autoFocus value={answers.region} onChange={(e) => setAnswers({ ...answers, region: e.target.value })} placeholder="예: 서울 송파구 문정동" /></label><Next disabled={!answers.region.trim()} onClick={() => setStep(1)} /></Question>}
          {step === 1 && <ChoiceQuestion data={choiceSteps[0]} value={answers.homeType} onChoose={choose} />}
          {step === 2 && <Question title="난방하는 공간은 몇 평인가요?" hint="공급면적 또는 대략적인 평수를 입력해도 괜찮습니다."><label className={styles.areaInput}><input inputMode="numeric" value={answers.area} onChange={(e) => setAnswers({ ...answers, area: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder="32" /><span>평</span></label><div className={styles.quick}>{["20", "24", "32", "40", "50"].map((v) => <button key={v} onClick={() => setAnswers({ ...answers, area: v })}>{v}평</button>)}</div><Next disabled={!answers.area} onClick={() => setStep(3)} /></Question>}
          {step === 3 && <ChoiceQuestion data={choiceSteps[1]} value={answers.fuel} onChoose={choose} />}
          {step === 4 && <ChoiceQuestion data={choiceSteps[2]} value={answers.drain} onChoose={choose} />}
          {step === 5 && <ChoiceQuestion data={choiceSteps[3]} value={answers.controllers} onChoose={choose} />}
          {step === 6 && <ChoiceQuestion data={choiceSteps[4]} value={answers.timing} onChoose={choose} />}
          {step === 7 && !submitted && <Question title="추천 결과가 나왔어요" hint="현장 사진 확인 후 정확한 모델과 설치 범위를 안내해 드립니다."><div className={styles.result}><span>예상 추천</span><strong>{result.capacity}</strong><b>{result.type}</b><ul><li>경동나비엔·귀뚜라미 모델 비교</li><li>연통·배수구·각방제어 사진 확인 필요</li><li>현장 조건에 따라 용량과 설치비가 달라질 수 있음</li></ul></div><div className={styles.contact}><label>이름<input value={answers.name} onChange={(e) => setAnswers({ ...answers, name: e.target.value })} placeholder="홍길동" /></label><label>휴대전화<input inputMode="tel" value={answers.phone} onChange={(e) => setAnswers({ ...answers, phone: e.target.value })} placeholder="010-0000-0000" /></label><label className={styles.consent}><input type="checkbox" checked={answers.consent} onChange={(e) => setAnswers({ ...answers, consent: e.target.checked })} /><span>상담을 위한 개인정보 수집·이용에 동의합니다.</span></label><button className={styles.submit} onClick={submit}>이 추천으로 상담 요청</button></div></Question>}
          {step === 7 && submitted && <div className={styles.done}><span>REQUEST SAVED</span><h2>상담 요청을<br />저장했습니다.</h2><p>입력하신 설치 조건과 추천 결과가 이 기기에 안전하게 보관되었습니다. DB 연결 후에는 담당자에게 자동 전달됩니다.</p><button onClick={close}>확인</button></div>}
        </div>
        <footer>제품과 설치 가능 여부는 현장 확인 후 최종 확정됩니다.</footer>
      </section>
    </div>}
  </>;
}

function Question({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) { return <div className={styles.question}><p>우리집 보일러 찾기</p><h2>{title}</h2><span>{hint}</span>{children}</div>; }
function Next({ disabled, onClick }: { disabled: boolean; onClick: () => void }) { return <button className={styles.next} disabled={disabled} onClick={onClick}>다음 질문</button>; }
function ChoiceQuestion({ data, value, onChoose }: { data: typeof choiceSteps[number]; value: string; onChoose: (key: keyof Answers, value: string) => void }) { return <Question title={data.title} hint={data.hint}><div className={styles.choices}>{data.choices.map((choice, index) => <button className={value === choice ? styles.selected : ""} key={choice} onClick={() => onChoose(data.key, choice)}><i>{String(index + 1).padStart(2, "0")}</i><span>{choice}</span><b>→</b></button>)}</div></Question>; }

