import type { MetadataRoute } from "next";
import { serviceAreas } from "./regions/data";
import { boilerBrands } from "./brands/data";
import { boilerGuides } from "./guides/data";
const siteUrl="https://rocketboiler.vercel.app";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl },
    { url: `${siteUrl}/regions` },
    { url: `${siteUrl}/brands` },
    { url: `${siteUrl}/guides` },
    ...serviceAreas.map(({ slug }) => ({ url: `${siteUrl}/regions/${slug}` })),
    ...boilerBrands.map(({ slug }) => ({ url: `${siteUrl}/brands/${slug}` })),
    ...boilerGuides.map(({ slug }) => ({ url: `${siteUrl}/guides/${slug}` })),
  ];
}

