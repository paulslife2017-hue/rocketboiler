import { boilerBrands } from "../brands/data";
import { boilerGuides } from "../guides/data";
import { serviceAreas } from "../regions/data";

const siteUrl="https://rocketboiler.vercel.app";
export function GET(){
  const body=[
    "# 로켓보일러",
    "",
    "> 서울 전 지역, 경기 9개 시, 인천 8개 구의 가정용 보일러 교체·설치와 사진 견적 안내 서비스입니다.",
    "",
    "## 주요 서비스",
    "- 가스보일러 교체 비용 및 설치 가격 안내",
    "- 귀뚜라미·경동나비엔·린나이 일반형·콘덴싱 보일러 비교",
    "- 평수, 욕실 수, 연통, 배수구, 각방제어 조건 확인",
    "- 모바일 사진 견적 및 설치 희망 일정 접수",
    "",
    "## 브랜드 안내",
    ...boilerBrands.map(brand=>`- [${brand.name} 보일러](${siteUrl}/brands/${brand.slug}): ${brand.description}`),
    "",
    "## 구매 가이드",
    ...boilerGuides.map(guide=>`- [${guide.title}](${siteUrl}/guides/${guide.slug}): ${guide.description}`),
    "",
    "## 설치 지역",
    ...serviceAreas.map(area=>`- [${area.province} ${area.name}](${siteUrl}/regions/${area.slug}): ${area.neighborhoods.join(", ")} 및 서비스 지역`),
    "",
    "## 중요 안내",
    "- 공개 가격은 제품과 기본 설치의 참고 범위이며 최종 견적은 사진 또는 현장 확인 후 안내합니다.",
    "- 추가 작업은 필요한 경우에만 작업 전에 설명합니다.",
    "- 인천 영종도·강화군 등 도서 지역은 방문 지역에서 제외됩니다."
  ].join("\n");
  return new Response(body,{headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"public, max-age=3600, s-maxage=3600"}});
}

