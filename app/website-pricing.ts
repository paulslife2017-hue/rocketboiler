export function recommendation(areaText: string, drain: string, brand: string, controllers: string, controllerBrand: string, homeType: string, boilerPosition: string) {
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
