import type { MetadataRoute } from "next";

const baseUrl = "https://rocket-boiler-kr.kbeuaty.chatgpt.site";
const regions = ["gangnam", "seocho", "songpa", "gangdong", "mapo", "gangseo", "nowon", "seongnam"];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    ...regions.map((region) => ({ url: `${baseUrl}/regions/${region}`, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
