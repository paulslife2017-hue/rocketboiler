"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./boiler-finder.module.css";

type Answers = {
  region: string;
  installationType: string;
  currentBrand: string;
  replaceReason: string;
  installReadiness: string;
  homeType: string;
  area: string;
  fuel: string;
  drain: string;
  controllers: string;
  extras: string[];
  timing: string;
  timingTime: string;
  name: string;
  phone: string;
  consent: boolean;
};

const initialAnswers: Answers = { region: "", installationType: "", currentBrand: "", replaceReason: "", installReadiness: "", homeType: "", area: "", fuel: "", drain: "", controllers: "", extras: [], timing: "", timingTime: "", name: "", phone: "", consent: false };
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
  { key: "installationType", title: "어떤 설치가 필요하신가요?", hint: "현재 상황에 맞는 질문과 예상 견적을 안내해 드립니다.", choices: ["기존 보일러 교체", "새집·상가 신규 설치", "잘 모르겠어요"] },
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
  const [photos, setPhotos] = useState<{ id: string; file: File; url: string }[]>([]);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const result = useMemo(() => recommendation(answers.area, answers.drain), [answers.area, answers.drain]);
  const extraTotal = useMemo(() => extraOptions.filter((item) => answers.extras.includes(item.name)).reduce((sum, item) => sum + item.price, 0), [answers.extras]);
  const estimatedTotal = answers.drain === "잘 모르겠어요" ? `${(result.minPrice + extraTotal).toLocaleString("ko-KR")}~${(result.maxPrice + extraTotal).toLocaleString("ko-KR")}원` : `${(result.basePrice + extraTotal).toLocaleString("ko-KR")}원`;
  const totalSteps = 12;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const choose = (key: keyof Answers, value: string) => {
    setAnswers((current) => ({ ...current, [key]: value }));
    setTimeout(() => setStep((current) => Math.min(current + 1, totalSteps - 1)), 140);
  };

  const toggleExtra = (name: string) => setAnswers((current) => ({ ...current, extras: current.extras.includes(name) ? current.extras.filter((item) => item !== name) : [...current.extras, name] }));

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const available = Math.max(0, 6 - photos.length);
    const next = Array.from(files).filter((file) => file.type.startsWith("image/")).slice(0, available).map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }));
    setPhotos((current) => [...current, ...next]);
  };

  const removePhoto = (id: string) => setPhotos((current) => current.filter((photo) => { if (photo.id === id) URL.revokeObjectURL(photo.url); return photo.id !== id; }));

  const submit = () => {
    if (!answers.name.trim() || !/^01[016789]-?\d{3,4}-?\d{4}$/.test(answers.phone) || !answers.consent) return;
    const lead = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), source: window.location.pathname, ...answers, photoCount: photos.length, photoNames: photos.map((photo) => photo.file.name), recommendation: result };
    const saved = JSON.parse(localStorage.getItem("rocketboiler-leads") || "[]");
    localStorage.setItem("rocketboiler-leads", JSON.stringify([lead, ...saved].slice(0, 20)));
    setSubmitted(true);
  };

  const close = () => { setOpen(false); photos.forEach((photo) => URL.revokeObjectURL(photo.url)); setPhotos([]); setTimeout(() => { setStep(0); setSubmitted(false); }, 250); };
  const progress = `${((step + 1) / totalSteps) * 100}%`;

  return <>
    <button className={styles.launcher} onClick={() => setOpen(true)} aria-haspopup="dialog"><span>30초</span><strong>보일러 찾기</strong><i>→</i></button>
    {open && <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <section className={styles.panel} role="dialog" aria-modal="true" aria-label="나에게 맞는 보일러 찾기">
        <header><button onClick={step ? () => setStep(step - 1) : close} aria-label={step ? "이전 질문" : "닫기"}>←</button><div><b>ROCKET MATCH</b><span>{step + 1} / {totalSteps}</span></div><button onClick={close} aria-label="닫기">×</button></header>
        <div className={styles.progress}><i style={{ width: progress }} /></div>
        <div className={styles.content}>
          {step === 0 && <Question title="어느 구에 설치하시나요?" hint="상세 주소는 필요하지 않아요. 구 이름만 적어주세요."><label className={styles.inputLabel}>설치 지역<input autoFocus value={answers.region} onChange={(e) => setAnswers({ ...answers, region: e.target.value })} placeholder="예: 송파구" /></label><Next disabled={!answers.region.trim()} onClick={() => setStep(1)} /></Question>}
          {step === 1 && <ChoiceQuestion data={choiceSteps[0]} value={answers.installationType} onChoose={choose} />}
          {step === 2 && answers.installationType === "기존 보일러 교체" && <Question title="현재 보일러를 알려주세요" hint="제조사와 교체 이유를 알면 호환 부품과 작업 범위를 더 정확히 확인할 수 있어요."><div className={styles.situationGrid}><label className={styles.dateInput}>현재 제조사<select value={answers.currentBrand} onChange={(e) => setAnswers({ ...answers, currentBrand: e.target.value })}><option value="">선택해 주세요</option><option>경동나비엔</option><option>귀뚜라미</option><option>린나이</option><option>대성셀틱</option><option>기타·잘 모르겠어요</option></select></label><label className={styles.dateInput}>교체 이유<select value={answers.replaceReason} onChange={(e) => setAnswers({ ...answers, replaceReason: e.target.value })}><option value="">선택해 주세요</option><option>10년 이상 사용</option><option>난방이 잘 안 됨</option><option>온수가 잘 안 나옴</option><option>누수·소음 발생</option><option>잦은 고장</option><option>이사 전 교체</option><option>에너지 비용 절감</option><option>기타·잘 모르겠어요</option></select></label></div><Next disabled={!answers.currentBrand || !answers.replaceReason} onClick={() => setStep(3)} /></Question>}
          {step === 2 && answers.installationType !== "기존 보일러 교체" && <Question title="설치 자리는 준비되어 있나요?" hint="기존 배관과 연통 구멍 유무에 따라 신규 설치 범위가 달라집니다."><div className={styles.choices}>{["보일러 자리와 배관이 있어요", "설치 공간만 있어요", "처음부터 공사가 필요해요", "잘 모르겠어요"].map((choice, index) => <button className={answers.installReadiness === choice ? styles.selected : ""} key={choice} onClick={() => { setAnswers({ ...answers, installReadiness: choice }); setTimeout(() => setStep(3), 140); }}><i>{String(index + 1).padStart(2, "0")}</i><span>{choice}</span><b>→</b></button>)}</div></Question>}
          {step === 3 && <ChoiceQuestion data={choiceSteps[1]} value={answers.homeType} onChoose={choose} />}
          {step === 4 && <Question title="난방하는 공간은 몇 평인가요?" hint="공급면적 또는 대략적인 평수를 입력해도 괜찮습니다."><label className={styles.areaInput}><input inputMode="numeric" value={answers.area} onChange={(e) => setAnswers({ ...answers, area: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder="32" /><span>평</span></label><div className={styles.quick}>{["20", "24", "32", "40", "50"].map((v) => <button key={v} onClick={() => setAnswers({ ...answers, area: v })}>{v}평</button>)}</div><Next disabled={!answers.area} onClick={() => setStep(5)} /></Question>}
          {step === 5 && <ChoiceQuestion data={choiceSteps[2]} value={answers.fuel} onChoose={choose} />}
          {step === 6 && <ChoiceQuestion data={choiceSteps[3]} value={answers.drain} onChoose={choose} />}
          {step === 7 && <ChoiceQuestion data={choiceSteps[4]} value={answers.controllers} onChoose={choose} />}
          {step === 8 && <Question title="추가 작업이 예상되나요?" hint="현재 알고 있는 항목만 선택해 주세요. 잘 모르시면 선택 없이 넘어가도 됩니다."><div className={styles.extraNotice}><b>추가금은 언제 발생하나요?</b><p>기본 설치 범위를 벗어난 타공, 연통 연장, 부속 교체 등이 필요한 경우에만 발생합니다. 사진과 현장 확인 후 작업 전에 먼저 안내드립니다.</p></div><div className={styles.extras}>{extraOptions.map((item) => <button key={item.name} className={answers.extras.includes(item.name) ? styles.extraSelected : ""} onClick={() => toggleExtra(item.name)}><i>{answers.extras.includes(item.name) ? "✓" : ""}</i><span><b>{item.name}<small>{item.note}</small></b><p>{item.description}</p></span><em>{item.price ? `+${item.price.toLocaleString("ko-KR")}원` : "별도 견적"}</em></button>)}</div><div className={styles.extraSummary}><span>선택 항목 예상 추가금<small>수량과 현장 조건에 따라 달라질 수 있습니다.</small></span><strong>+{extraTotal.toLocaleString("ko-KR")}원</strong></div><Next disabled={false} onClick={() => setStep(9)} /></Question>}
          {step === 9 && <Question title="사진을 보내주시면 더 정확해요" hint="아래 항목이 잘 보이도록 최대 6장까지 촬영하거나 선택해 주세요."><div className={styles.photoGuide}>{["보일러 전체", "모델명 라벨", "하단 배관", "연통 연결부", "배수구 위치", "각방 조절기"].map((item, index) => <span key={item}><i>{index + 1}</i>{item}</span>)}</div><div className={styles.photoActions}><button onClick={() => cameraInput.current?.click()} disabled={photos.length >= 6}><b>카메라로 촬영</b><span>후면 카메라 열기</span></button><button onClick={() => galleryInput.current?.click()} disabled={photos.length >= 6}><b>갤러리에서 선택</b><span>여러 장 선택 가능</span></button><input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} /><input ref={galleryInput} type="file" accept="image/*" multiple hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} /></div>{photos.length > 0 && <div className={styles.photoGrid}>{photos.map((photo, index) => <figure key={photo.id}><img src={photo.url} alt={`견적 사진 ${index + 1}`} /><figcaption>사진 {index + 1}</figcaption><button onClick={() => removePhoto(photo.id)} aria-label={`사진 ${index + 1} 삭제`}>×</button></figure>)}</div>}<div className={styles.photoStatus}><span>{photos.length} / 6장 선택</span><b>{photos.length >= 3 ? "사진 견적 준비 완료" : photos.length ? "3장 이상이면 더 정확해요" : "사진 없이도 상담 가능"}</b></div><p className={styles.photoPrivacy}>사진은 현재 화면에서만 임시 미리보기 됩니다. 서버 저장소 연결 전에는 담당자에게 전송되지 않습니다.</p><button className={styles.next} onClick={() => setStep(10)}>{photos.length ? "이 사진으로 계속" : "사진 없이 계속"}</button></Question>}
          {step === 10 && <Question title="언제 설치를 원하시나요?" hint="희망 날짜와 방문하기 편한 시간대를 선택해 주세요."><div className={styles.dateTime}><label className={styles.dateInput}>희망 설치일<input type="date" min={new Date().toISOString().slice(0, 10)} value={answers.timing} onChange={(e) => setAnswers({ ...answers, timing: e.target.value })} /></label><label className={styles.dateInput}>희망 시간대<select value={answers.timingTime} onChange={(e) => setAnswers({ ...answers, timingTime: e.target.value })}><option value="">시간대를 선택해 주세요</option><option>오전 9시~11시</option><option>오전 11시~오후 1시</option><option>오후 1시~3시</option><option>오후 3시~5시</option><option>시간 협의</option></select></label></div><p className={styles.scheduleNote}>실제 방문 시간은 기사 배정 후 전화로 최종 확인해 드립니다.</p><Next disabled={!answers.timing || !answers.timingTime} onClick={() => setStep(11)} /></Question>}
          {step === 11 && !submitted && <Question title="추천 결과가 나왔어요" hint="현장 사진 확인 후 정확한 모델과 설치 범위를 안내해 드립니다."><div className={styles.result}><span>{answers.installationType}</span><strong>{result.capacity}</strong><b>{result.model} · {result.type}</b><div className={styles.installSummary}>{answers.installationType === "기존 보일러 교체" ? <><b>{answers.currentBrand} 교체</b><span>{answers.replaceReason}</span></> : <><b>신규 설치 조건</b><span>{answers.installReadiness || "현장 확인 필요"}</span></>}</div><div className={styles.price}><small>예상 기본가</small><em>{result.price}</em><i>제품·기본 설치 참고가</i></div>{answers.extras.length > 0 && <div className={styles.selectedExtras}><span>선택한 추가 작업</span><p>{answers.extras.join(" · ")}</p><b>예상 추가금 +{extraTotal.toLocaleString("ko-KR")}원</b></div>}<div className={styles.totalPrice}><span>예상 합계</span><strong>{estimatedTotal}</strong></div><ul><li>선택 사진 {photos.length}장</li><li>희망 일정 {answers.timing} · {answers.timingTime}</li><li>{answers.installationType === "기존 보일러 교체" ? "기존 제품 철거·수거와 동일 위치 설치 여부 확인" : "신규 배관·연통·타공 범위 확인"}</li><li>수량·현장 조건에 따라 최종 가격이 달라질 수 있음</li></ul></div><div className={styles.contact}><label>이름<input value={answers.name} onChange={(e) => setAnswers({ ...answers, name: e.target.value })} placeholder="홍길동" /></label><label>휴대전화<input inputMode="tel" value={answers.phone} onChange={(e) => setAnswers({ ...answers, phone: e.target.value })} placeholder="010-0000-0000" /></label><label className={styles.consent}><input type="checkbox" checked={answers.consent} onChange={(e) => setAnswers({ ...answers, consent: e.target.checked })} /><span>상담을 위한 개인정보 수집·이용에 동의합니다.</span></label><button className={styles.submit} onClick={submit}>이 추천으로 상담 요청</button></div></Question>}
          {step === 11 && submitted && <div className={styles.done}><span>REQUEST SAVED</span><h2>상담 요청을<br />저장했습니다.</h2><p>설치 조건과 추천 결과는 이 기기에 보관되었습니다. 선택한 사진은 서버 저장소 연결 후 담당자에게 자동 전달할 수 있습니다.</p><button onClick={close}>확인</button></div>}
        </div>
        <footer>제품과 설치 가능 여부는 현장 확인 후 최종 확정됩니다.</footer>
      </section>
    </div>}
  </>;
}

function Question({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) { return <div className={styles.question}><p>우리집 보일러 찾기</p><h2>{title}</h2><span>{hint}</span>{children}</div>; }
function Next({ disabled, onClick }: { disabled: boolean; onClick: () => void }) { return <button className={styles.next} disabled={disabled} onClick={onClick}>다음 질문</button>; }
function ChoiceQuestion({ data, value, onChoose }: { data: typeof choiceSteps[number]; value: string; onChoose: (key: keyof Answers, value: string) => void }) { return <Question title={data.title} hint={data.hint}><div className={styles.choices}>{data.choices.map((choice, index) => <button className={value === choice ? styles.selected : ""} key={choice} onClick={() => onChoose(data.key, choice)}><i>{String(index + 1).padStart(2, "0")}</i><span>{choice}</span><b>→</b></button>)}</div></Question>; }

