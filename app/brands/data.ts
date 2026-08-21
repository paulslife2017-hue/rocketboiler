export type BoilerBrand = {
  slug: string;
  name: string;
  headline: string;
  description: string;
  priceNote: string;
  strengths: string[];
  keywords: string[];
};

export const boilerBrands: BoilerBrand[] = [
  {
    slug: "kiturami",
    name: "귀뚜라미",
    headline: "합리적인 가격부터 비교하는 귀뚜라미 보일러",
    description: "일반형과 1등급 친환경 콘덴싱 제품을 난방 평수와 온수 사용량에 맞춰 비교합니다.",
    priceNote: "일반형 원룸 60만원대부터, 콘덴싱 원룸 75만~80만원부터 비교합니다.",
    strengths: ["일반형·콘덴싱 선택 가능", "평수별 다양한 용량", "합리적인 교체 예산 비교"],
    keywords: ["귀뚜라미 보일러", "귀뚜라미 보일러 교체", "귀뚜라미 보일러 가격", "귀뚜라미 콘덴싱 보일러", "귀뚜라미 가스보일러 설치"]
  },
  {
    slug: "kyungdong-navien",
    name: "경동나비엔",
    headline: "온수 사용량까지 고려하는 경동나비엔 보일러",
    description: "욕실 수와 동시 온수 사용, 단열 상태를 확인해 일반형과 콘덴싱 제품의 적정 용량을 안내합니다.",
    priceNote: "동일한 설치 조건에서 귀뚜라미 기준 예상가보다 약 5만원 높은 범위로 비교합니다.",
    strengths: ["콘덴싱 제품 폭넓게 비교", "온수 사용량 중심 용량 선택", "아파트·주택 설치 조건 확인"],
    keywords: ["경동나비엔 보일러", "경동나비엔 보일러 교체", "경동나비엔 보일러 가격", "나비엔 콘덴싱 보일러", "경동 보일러 설치"]
  },
  {
    slug: "rinnai",
    name: "린나이",
    headline: "설치 환경과 조절기까지 확인하는 린나이 보일러",
    description: "기존 배관과 연통, 각방제어 호환 여부를 사진으로 확인하고 적합한 용량과 제품군을 비교합니다.",
    priceNote: "동일한 설치 조건에서 귀뚜라미 기준 예상가보다 약 3만원 높은 범위로 비교합니다.",
    strengths: ["일반형·콘덴싱 제품 비교", "각방제어 호환 조건 확인", "사진으로 설치 범위 사전 안내"],
    keywords: ["린나이 보일러", "린나이 보일러 교체", "린나이 보일러 가격", "린나이 콘덴싱 보일러", "린나이 가스보일러 설치"]
  }
];

export function getBoilerBrand(slug: string){ return boilerBrands.find(brand=>brand.slug===slug); }

