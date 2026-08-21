export type BoilerGuide = {slug:string;title:string;headline:string;description:string;points:{title:string;text:string}[];keywords:string[]};

export const boilerGuides: BoilerGuide[] = [
  {slug:"boiler-replacement-cost",title:"보일러 교체 비용",headline:"보일러 가격과 설치비를 함께 확인하세요",description:"제품 용량과 브랜드뿐 아니라 배관, 연통, 배수구와 각방제어 조건이 최종 견적에 영향을 줍니다.",points:[{title:"제품·용량",text:"난방 평수와 욕실 수, 동시 온수 사용량을 기준으로 용량을 선택합니다."},{title:"기본 설치",text:"기존 보일러 철거와 기본 배관 연결 등 포함 범위를 확인합니다."},{title:"현장 조건",text:"연통, 타공, 배관 수정 가능성은 사진 확인 후 작업 전에 안내합니다."}],keywords:["보일러 교체 비용","가스보일러 교체 가격","보일러 설치비","보일러 교체 견적","보일러 가격 비교"]},
  {slug:"condensing-vs-general",title:"콘덴싱 보일러와 일반 보일러 차이",headline:"배수구와 설치 환경에 맞는 제품을 선택하세요",description:"콘덴싱 보일러는 에너지 효율과 배수구 조건을, 일반 보일러는 설치 가능 여부와 예산을 함께 비교해야 합니다.",points:[{title:"효율 차이",text:"1등급 친환경 콘덴싱 제품과 일반형 제품의 효율과 가격 차이를 비교합니다."},{title:"배수구 확인",text:"콘덴싱 설치를 위해 보일러에서 약 3m 이내 배수 가능 여부를 확인합니다."},{title:"현장 적합성",text:"연료 종류, 연통 방식과 기존 배관 상태를 사진으로 확인합니다."}],keywords:["콘덴싱 보일러","일반 보일러","콘덴싱 보일러 가격","친환경 보일러 교체","콘덴싱 일반 보일러 차이"]},
  {slug:"boiler-capacity-by-home-size",title:"평수별 보일러 용량 선택",headline:"평수만이 아니라 온수 사용량도 중요합니다",description:"20평대, 30평대, 40평대 보일러는 욕실 수와 단열 상태에 따라 권장 용량이 달라질 수 있습니다.",points:[{title:"20평대",text:"난방 면적과 욕실 수를 확인해 일반형과 콘덴싱 용량을 비교합니다."},{title:"30·40평대",text:"동시 온수 사용과 난방 배관 길이를 고려해 한 단계 높은 용량도 검토합니다."},{title:"열 손실",text:"필로티, 끝집, 단열이 약한 구조는 실제 난방 조건을 함께 확인합니다."}],keywords:["20평 보일러 용량","30평 보일러 가격","40평 보일러 추천","평수별 보일러 용량","아파트 보일러 용량"]},
  {slug:"apartment-boiler-replacement",title:"아파트 보일러 교체",headline:"각방제어와 연통 방식을 먼저 확인하세요",description:"계단식·복도식 아파트, 각방제어기 브랜드, FF·FE 배기 방식에 따라 설치 준비가 달라집니다.",points:[{title:"각방제어",text:"각방제어기와 희망 보일러 브랜드가 다르면 통신변환기가 필요할 수 있습니다."},{title:"배기 방식",text:"개인 배기구 FF와 공동 배기구 FE 여부를 기존 연통 사진으로 확인합니다."},{title:"작업 공간",text:"세탁기 등으로 보일러 앞 공간이 좁다면 방문 전 이동이 필요할 수 있습니다."}],keywords:["아파트 보일러 교체","복도식 아파트 보일러","각방제어 보일러 교체","FF 보일러","FE 보일러"]}
];

export function getBoilerGuide(slug:string){return boilerGuides.find(guide=>guide.slug===slug);}

