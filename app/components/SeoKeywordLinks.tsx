import Link from "next/link";

const guideLinks = [
  ["보일러 교체 비용", "/guides/boiler-replacement-cost"],
  ["가스보일러 가격 비교", "/guides/gas-boiler-price-comparison"],
  ["콘덴싱·일반 보일러 차이", "/guides/condensing-vs-general"],
  ["평수별 보일러 용량", "/guides/boiler-capacity-by-home-size"],
  ["아파트 보일러 교체", "/guides/apartment-boiler-replacement"],
  ["보일러 수명·교체 시기", "/guides/boiler-life-replacement-time"],
] as const;

const brands = [
  ["귀뚜라미", "kiturami"],
  ["경동나비엔", "kyungdong-navien"],
  ["린나이", "rinnai"],
] as const;

type Props = { areaSlug?: string; areaName?: string; neighborhoods?: string[]; currentGuideSlug?: string };

export default function SeoKeywordLinks({ areaSlug, areaName, neighborhoods = [], currentGuideSlug }: Props) {
  const localLinks = areaSlug && areaName ? [
    ...neighborhoods.map((name) => [`${name} 보일러 교체·설치`, `/regions/${areaSlug}/${name}`] as const),
    ...brands.map(([name, slug]) => [`${areaName} ${name} 보일러 가격`, `/regions/${areaSlug}/brands/${slug}`] as const),
  ] : [];
  const links = [...localLinks, ...guideLinks.filter(([, href]) => !currentGuideSlug || href !== `/guides/${currentGuideSlug}`)];
  return <div>{links.map(([label, href]) => <Link href={href} key={`${href}-${label}`}>{label}<small>안내 보기</small></Link>)}</div>;
}
