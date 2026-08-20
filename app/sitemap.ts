import type { MetadataRoute } from "next";
import { serviceAreas } from "./regions/data";
const siteUrl="https://rocketboiler.vercel.app";
export default function sitemap():MetadataRoute.Sitemap{const now=new Date();return[{url:siteUrl,lastModified:now,changeFrequency:"weekly",priority:1},{url:`${siteUrl}/regions`,lastModified:now,changeFrequency:"monthly",priority:.9},...serviceAreas.map(({slug})=>({url:`${siteUrl}/regions/${slug}`,lastModified:now,changeFrequency:"monthly" as const,priority:.75}))]}

