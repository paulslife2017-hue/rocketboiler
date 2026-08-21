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
  fuelOther: string;
  drain: string;
  controllers: string;
  controllerBrand: string;
  preferredBrand: string;
  boilerPosition: string;
  exhaustType: string;
  extras: string[];
  timing: string;
  timingTime: string;
  name: string;
  phone: string;
  consent: boolean;
};

const initialAnswers: Answers = { region: "", installationType: "", currentBrand: "", replaceReason: "", installReadiness: "", homeType: "", area: "", fuel: "", fuelOther: "", drain: "", controllers: "", controllerBrand: "", preferredBrand: "", boilerPosition: "", exhaustType: "", extras: [], timing: "", timingTime: "", name: "", phone: "", consent: false };
const choiceSteps = [
  { key: "installationType", title: "어떤 설치가 필요하신가요?", hint: "현재 상황에 맞는 질문과 예상 견적을 안내해 드립니다.", choices: ["기존 보일러 교체", "새집·상가 신규 설치", "설치 유형 확인이 필요해요"] },
  { key: "homeType", title: "어떤 공간에 설치하시나요?", hint: "건물 형태에 따라 배기와 설치 조건이 달라집니다.", choices: ["계단식 아파트 (일반 아파트·연통 짧음)", "복도식 아파트", "빌라·오피스텔", "단독주택", "상가", "잘 모르겠어요"] },
  { key: "drain", title: "보일러 3m 안에 배수구가 있나요?", hint: "배수구가 있으면 콘덴싱 보일러 설치 가능성을 확인할 수 있습니다.", choices: ["있어요", "없어요", "잘 모르겠어요"] },
] as const;

function recommendation(areaText: string, drain: string, brand: string, controllers: string, controllerBrand: string, homeType: string, boilerPosition: string) {
  const area = Number(areaText) || 0;
  const generalTable = [
    { maxArea: 21, capacity: "약 21평 · 15K", model: "NGB 554-15K", price: 700000 },
    { maxArea: 30, capacity: "약 30평 · 20K", model: "NGB 554-20K", price: 750000 },
    { maxArea: 40, capacity: "약 40평 · 25K", model: "NGB 554-25K", price: 800000 },
  ];
  const condensingTable = [
    { maxArea: 15, capacity: "약 15평 · 13K", model: "NCB 354-13K", price: 750000 },
    { maxArea: 21, capacity: "약 21평 · 15K", model: "NCB 354-15K", price: 800000 },
    { maxArea: 24, capacity: "약 24평 · 18K", model: "NCB 354-18K", price: 850000 },
    { maxArea: 34, capacity: "약 34평 · 22K", model: "NCB 354-22K", price: 900000 },
    { maxArea: 44, capacity: "약 44평 · 27K", model: "NCB 354-27K", price: 950000 },
    { maxArea: 54, capacity: "약 54평 · 33K", model: "NCB 354-33K", price: 1000000 },
  ];
  const pick = (table: typeof condensingTable) => {
    const index = table.findIndex((item) => area <= item.maxArea);
    const safeIndex = index < 0 ? table.length - 1 : index;
    return { selected: table[safeIndex], upgrade: table[Math.min(safeIndex + 1, table.length - 1)] };
  };
  const general = pick(generalTable);
  const condensing = pick(condensingTable);
  const chosen = drain === "없어요" ? general : condensing;
  const brandUp = brand === "경동나비엔" ? 50000 : brand === "린나이" ? 30000 : 0;
  const needsConverter = controllers === "2개 이상" && Boolean(controllerBrand) && controllerBrand !== "기타·잘 모르겠어요" && brand !== "상담 후 추천" && controllerBrand !== brand;
  const conditions = [needsConverter ? "각방제어 통신변환기 필요 가능성" : "", homeType === "복도식 아파트" ? "복도식 아파트 설치 조건" : "", boilerPosition === "난방 바닥이 보일러보다 위" ? "상향식 설치 조건" : ""].filter(Boolean);
  const conditionUp = (needsConverter ? 50000 : 0) + (homeType === "복도식 아파트" ? 100000 : 0) + (boilerPosition === "난방 바닥이 보일러보다 위" ? 50000 : 0);
  const type = drain === "있어요" ? "콘덴싱 보일러 우선 검토" : drain === "없어요" ? "일반형 또는 배수 공사 가능 여부 확인" : "일반형·콘덴싱 현장 확인";
  const baseMin = drain === "잘 모르겠어요" ? general.selected.price : chosen.selected.price;
  const baseMax = drain === "잘 모르겠어요" ? condensing.upgrade.price : chosen.upgrade.price;
  const minPrice = baseMin + brandUp + conditionUp;
  const maxPrice = baseMax + brandUp + conditionUp;
  const price = minPrice === maxPrice ? `${minPrice.toLocaleString("ko-KR")}원` : `${minPrice.toLocaleString("ko-KR")}~${maxPrice.toLocaleString("ko-KR")}원`;
  const selectedBrand = brand || "상담 후 추천";
  const model = selectedBrand === "귀뚜라미" || selectedBrand === "상담 후 추천" ? chosen.selected.model : `${selectedBrand} 동급 용량`;
  const reference = `귀뚜라미 가격표 ${chosen.selected.model} 기준 ${chosen.selected.price.toLocaleString("ko-KR")}원`;
  return { capacity: chosen.selected.capacity, type, price, minPrice, maxPrice, model, brand: selectedBrand, reference, conditions, brandAdjusted: brandUp > 0 };
}

async function compressPhoto(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = reject;
      element.src = url;
    });
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("compress_failed")), "image/jpeg", 0.78));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function BoilerFinder() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [photos, setPhotos] = useState<{ id: string; file: File; url: string }[]>([]);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const result = useMemo(() => recommendation(answers.area, answers.drain, answers.preferredBrand, answers.controllers, answers.controllerBrand, answers.homeType, answers.boilerPosition), [answers.area, answers.drain, answers.preferredBrand, answers.controllers, answers.controllerBrand, answers.homeType, answers.boilerPosition]);
  const estimatedTotal = result.price;
  const totalSteps = 12;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const choose = (key: keyof Answers, value: string) => {
    setAnswers((current) => ({ ...current, [key]: value }));
    setTimeout(() => setStep((current) => Math.min(current + 1, totalSteps - 1)), 140);
  };

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const available = Math.max(0, 6 - photos.length);
    const next = Array.from(files).filter((file) => file.type.startsWith("image/")).slice(0, available).map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }));
    setPhotos((current) => [...current, ...next]);
  };

  const removePhoto = (id: string) => setPhotos((current) => current.filter((photo) => { if (photo.id === id) URL.revokeObjectURL(photo.url); return photo.id !== id; }));

  const submit = async () => {
    if (!answers.name.trim() || !/^01[016789]-?\d{3,4}-?\d{4}$/.test(answers.phone) || !answers.consent) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const photoPaths: string[] = [];
      for (const photo of photos) {
        const compressed = await compressPhoto(photo.file);
        const upload = await fetch(`/api/photos/upload?filename=${encodeURIComponent(photo.file.name)}`, {
          method: "POST",
          headers: { "content-type": compressed.type },
          body: compressed,
        });
        if (!upload.ok) throw new Error("photo_upload_failed");
        const stored = await upload.json();
        photoPaths.push(stored.pathname);
      }
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: window.location.pathname, ...answers, extras: [`희망 브랜드: ${answers.preferredBrand || "상담 후 추천"}`, `각방제어: ${answers.controllers}${answers.controllerBrand ? ` / ${answers.controllerBrand}` : ""}`, `보일러 위치: ${answers.boilerPosition}`, `배기 방식: ${answers.exhaustType}`, answers.fuelOther ? `기타 연료: ${answers.fuelOther}` : ""].filter(Boolean), area: Number(answers.area), photoNames: photos.map((photo) => photo.file.name), photoPaths, recommendation: { ...result, estimatedTotal } }),
      });
      if (!response.ok) throw new Error("save_failed");
      setSubmitted(true);
    } catch {
      setSubmitError("저장 중 문제가 생겼습니다. 잠시 후 다시 눌러주세요.");
    } finally {
      setSubmitting(false);
    }
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
          {step === 5 && <Question title="사용 중인 연료는 무엇인가요?" hint="가스계량기나 기존 보일러 표기를 확인해 주세요."><div className={styles.choices}>{["도시가스(LNG)", "LPG", "기름", "전기", "펠렛", "심야", "잘 모름", "기타 연료·제품"].map((choice, index) => <button className={answers.fuel === choice ? styles.selected : ""} key={choice} onClick={() => setAnswers({ ...answers, fuel: choice })}><i>{String(index + 1).padStart(2, "0")}</i><span>{choice}</span><b>→</b></button>)}</div>{answers.fuel === "기타 연료·제품" && <label className={styles.inputLabel}>연료 또는 제품<input value={answers.fuelOther} onChange={(e) => setAnswers({ ...answers, fuelOther: e.target.value })} placeholder="예: 화목, 산업용 보일러" /></label>}<Next disabled={!answers.fuel || (answers.fuel === "기타 연료·제품" && !answers.fuelOther.trim())} onClick={() => setStep(6)} /></Question>}
          {step === 6 && <ChoiceQuestion data={choiceSteps[2]} value={answers.drain} onChoose={choose} />}
          {step === 7 && <Question title="온도조절기와 희망 브랜드를 알려주세요" hint="보일러 회사와 각방제어 회사가 다르면 통신변환기가 필요할 수 있습니다."><div className={styles.quick}>{["1개", "2개 이상", "잘 모르겠어요"].map((value) => <button className={answers.controllers === value ? styles.selected : ""} key={value} onClick={() => setAnswers({ ...answers, controllers: value })}>{value}</button>)}</div><div className={styles.situationGrid}>{answers.controllers === "2개 이상" && <label className={styles.dateInput}>각방제어기 브랜드<select value={answers.controllerBrand} onChange={(e) => setAnswers({ ...answers, controllerBrand: e.target.value })}><option value="">선택해 주세요</option><option>코텍</option><option>하니웰</option><option>경동나비엔</option><option>귀뚜라미</option><option>린나이</option><option>기타·잘 모르겠어요</option></select></label>}<label className={styles.dateInput}>희망 보일러 브랜드<select value={answers.preferredBrand} onChange={(e) => setAnswers({ ...answers, preferredBrand: e.target.value })}><option value="">선택해 주세요</option><option>귀뚜라미</option><option>린나이</option><option>경동나비엔</option><option>상담 후 추천</option></select></label></div>{answers.controllers === "2개 이상" && <div className={styles.extraNotice}><b>각방제어 통신변환기 안내</b><p>보일러 회사와 각방제어 회사가 서로 다를 때 통신을 연결하는 장치입니다. 필요한 경우에만 50,000원이 반영됩니다.</p></div>}<Next disabled={!answers.controllers || !answers.preferredBrand || (answers.controllers === "2개 이상" && !answers.controllerBrand)} onClick={() => setStep(8)} /></Question>}
          {step === 8 && <Question title="보일러 위치와 배기 방식을 확인해 주세요" hint="사진을 보고 선택해도 되고, 모르면 현장에서 확인해 드립니다."><div className={styles.situationGrid}><label className={styles.dateInput}>난방 바닥과 보일러 위치<select value={answers.boilerPosition} onChange={(e) => setAnswers({ ...answers, boilerPosition: e.target.value })}><option value="">선택해 주세요</option><option>난방 바닥이 보일러보다 아래</option><option>난방 바닥이 보일러보다 위</option><option>보일러와 비슷한 높이</option><option>잘 모르겠어요</option></select></label><label className={styles.dateInput}>연도 배기 방식<select value={answers.exhaustType} onChange={(e) => setAnswers({ ...answers, exhaustType: e.target.value })}><option value="">선택해 주세요</option><option>FF 개인 배기구 (창문·외벽에 연통이 보임)</option><option>FE 공동 배기구 (외부에 연통이 따로 안 보임)</option><option>잘 모르겠어요</option></select></label></div><div className={styles.extraNotice}><b>기본 설치에 무료 포함</b><p>기본 설치 · 배관 청소 · 일산화탄소(CO) 감지기 설치 · 배상책임보험 가입 · 도시가스 서류 접수 대행</p></div><div className={styles.paidServices}><b>현장에 따라 추가될 수 있는 작업</b><div className={styles.servicePriceList}><span><i>코어 타공</i><em>구멍당 100,000원</em></span><span><i>플렉시블 교체</i><em>50,000원</em></span><span><i>감압밸브 설치</i><em>30,000원</em></span><span><i>중간밸브 교체</i><em>20,000원</em></span><span><i>연통 연장</i><em>1m당 20,000원</em></span><span><i>배관 수정 작업</i><em>20,000원부터</em></span><span><i>통신변환기(각방 중계기)</i><em>50,000원</em></span></div><p>사진 또는 현장 확인 후 필요한 경우에만 진행하며, 작업 전에 비용을 먼저 안내합니다.</p></div><Next disabled={!answers.boilerPosition || !answers.exhaustType} onClick={() => setStep(9)} /></Question>}
          {step === 9 && <Question title="사진을 보내주시면 더 정확해요" hint="아래 항목이 잘 보이도록 최대 6장까지 촬영하거나 선택해 주세요."><div className={styles.photoGuide}>{["보일러 전체", "모델명 라벨", "하단 배관", "연통 연결부", "배수구 위치", "각방 조절기"].map((item, index) => <span key={item}><i>{index + 1}</i>{item}</span>)}</div><div className={styles.photoActions}><button onClick={() => cameraInput.current?.click()} disabled={photos.length >= 6}><b>카메라로 촬영</b><span>후면 카메라 열기</span></button><button onClick={() => galleryInput.current?.click()} disabled={photos.length >= 6}><b>갤러리에서 선택</b><span>여러 장 선택 가능</span></button><input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} /><input ref={galleryInput} type="file" accept="image/*" multiple hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} /></div>{photos.length > 0 && <div className={styles.photoGrid}>{photos.map((photo, index) => <figure key={photo.id}><img src={photo.url} alt={`견적 사진 ${index + 1}`} /><figcaption>사진 {index + 1}</figcaption><button onClick={() => removePhoto(photo.id)} aria-label={`사진 ${index + 1} 삭제`}>×</button></figure>)}</div>}<div className={styles.photoStatus}><span>{photos.length} / 6장 선택</span><b>{photos.length >= 3 ? "사진 견적 준비 완료" : photos.length ? "3장 이상이면 더 정확해요" : "사진 없이도 상담 가능"}</b></div><p className={styles.photoPrivacy}>선택한 사진은 제출할 때 용량을 줄여 서울 리전의 비공개 저장소에 안전하게 전송됩니다.</p><button className={styles.next} onClick={() => setStep(10)}>{photos.length ? "이 사진으로 계속" : "사진 없이 계속"}</button></Question>}
          {step === 10 && <Question title="언제 설치를 원하시나요?" hint="희망 날짜와 방문하기 편한 시간대를 선택해 주세요."><div className={styles.dateTime}><label className={styles.dateInput}>희망 설치일<input type="date" min={new Date().toISOString().slice(0, 10)} value={answers.timing} onChange={(e) => setAnswers({ ...answers, timing: e.target.value })} /></label><label className={styles.dateInput}>희망 시간대<select value={answers.timingTime} onChange={(e) => setAnswers({ ...answers, timingTime: e.target.value })}><option value="">시간대를 선택해 주세요</option><option>오전 9시~11시</option><option>오전 11시~오후 1시</option><option>오후 1시~3시</option><option>오후 3시~5시</option><option>시간 협의</option></select></label></div><p className={styles.scheduleNote}>실제 방문 시간은 기사 배정 후 전화로 최종 확인해 드립니다.</p><Next disabled={!answers.timing || !answers.timingTime} onClick={() => setStep(11)} /></Question>}
          {step === 11 && !submitted && <Question title="추천 결과가 나왔어요" hint="현장 사진 확인 후 정확한 모델과 설치 범위를 안내해 드립니다."><div className={styles.result}><span>{answers.installationType}</span><strong>{result.capacity}</strong><b>{result.brand} · {result.model} · {result.type}</b><div className={styles.installSummary}>{answers.installationType === "기존 보일러 교체" ? <><b>{answers.currentBrand} 교체</b><span>{answers.replaceReason}</span></> : <><b>신규 설치 조건</b><span>{answers.installReadiness || "현장 확인 필요"}</span></>}</div><div className={styles.selectedExtras}><span>가격표 적용 기준</span><p>{result.reference}</p>{result.brandAdjusted && <b>선택 브랜드 가격 차이 반영</b>}{result.conditions.length > 0 && <p>설치 조건: {result.conditions.join(" · ")}</p>}</div><div className={styles.price}><small>조건 반영 예상가</small><em>{result.price}</em><i>제품·브랜드·선택한 설치 조건을 반영한 참고 범위</i></div><div className={styles.extraNotice}><b>가격이 범위로 표시되는 이유</b><p>욕실 2곳의 동시 온수 사용, 단열이 약한 집, 필로티처럼 열 손실이 큰 구조는 한 단계 높은 용량이 필요할 수 있어 안전한 범위로 안내합니다.</p></div><ul><li>일산화탄소 경보기·기본 온도조절기 설치</li><li>폐보일러 회수·보험·도시가스 접수 안내</li><li>선택 사진 {photos.length}장 · 희망 일정 {answers.timing} {answers.timingTime}</li><li>세탁기 등으로 작업 공간이 좁으면 방문 전 이동 필요</li><li>특수 위치와 현장 조건은 사진 확인 후 사전 안내</li></ul></div><div className={styles.contact}><label>이름<input value={answers.name} onChange={(e) => setAnswers({ ...answers, name: e.target.value })} placeholder="홍길동" /></label><label>휴대전화<input inputMode="tel" value={answers.phone} onChange={(e) => setAnswers({ ...answers, phone: e.target.value })} placeholder="010-0000-0000" /></label><label className={styles.consent}><input type="checkbox" checked={answers.consent} onChange={(e) => setAnswers({ ...answers, consent: e.target.checked })} /><span>상담을 위한 개인정보 수집·이용에 동의합니다.</span></label>{submitError && <p role="alert">{submitError}</p>}<button className={styles.submit} onClick={submit} disabled={submitting}>{submitting ? (photos.length ? `사진 ${photos.length}장 업로드 중...` : "안전하게 저장 중...") : "이 추천으로 상담 요청"}</button></div></Question>}
          {step === 11 && submitted && <div className={styles.done}><span>REQUEST SAVED</span><h2>상담 요청을<br />접수했습니다.</h2><p>설치 조건과 추천 결과, 선택한 사진이 담당자 확인용 시스템에 안전하게 저장되었습니다.</p><button onClick={close}>확인</button></div>}
        </div>
        <footer>제품과 설치 가능 여부는 현장 확인 후 최종 확정됩니다.</footer>
      </section>
    </div>}
  </>;
}

function Question({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) { return <div className={styles.question}><p>우리집 보일러 찾기</p><h2>{title}</h2><span>{hint}</span>{children}</div>; }
function Next({ disabled, onClick }: { disabled: boolean; onClick: () => void }) { return <button className={styles.next} disabled={disabled} onClick={onClick}>다음 질문</button>; }
function ChoiceQuestion({ data, value, onChoose }: { data: typeof choiceSteps[number]; value: string; onChoose: (key: keyof Answers, value: string) => void }) { return <Question title={data.title} hint={data.hint}><div className={styles.choices}>{data.choices.map((choice, index) => <button className={value === choice ? styles.selected : ""} key={choice} onClick={() => onChoose(data.key, choice)}><i>{String(index + 1).padStart(2, "0")}</i><span>{choice}</span><b>→</b></button>)}</div></Question>; }






