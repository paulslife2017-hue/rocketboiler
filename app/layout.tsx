import type { Metadata } from "next";
import "./globals.css";
import BoilerFinder from "./BoilerFinder";

const siteUrl = "https://rocketboiler.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "서울·경기 보일러 교체 비용·설치 | 로켓보일러", template: "%s | 로켓보일러" },
  description: "서울·경기·인천 가스보일러 교체 비용과 설치 가격을 사진으로 확인하세요. 경동나비엔·귀뚜라미·린나이 보일러 교체, 콘덴싱 보일러 설치와 현장 추가 비용을 미리 안내합니다.",
  keywords: ["보일러 교체 비용", "보일러 교체", "보일러 가격", "가스보일러 교체 비용", "보일러 설치 비용", "경동나비엔 보일러", "경동나비엔 보일러 교체", "귀뚜라미 보일러 교체", "콘덴싱 보일러 교체", "서울 보일러 교체", "경기 보일러 교체", "인천 보일러 설치", "보일러 사진 견적"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "로켓보일러",
    title: "서울·경기 보일러 교체 비용·설치 | 로켓보일러",
    description: "경동나비엔·귀뚜라미·린나이 가스보일러 교체 비용과 설치 가격을 사진으로 먼저 확인하세요.",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "로켓보일러 서울·경기 보일러 교체·설치" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "서울·경기 보일러 교체 비용·설치 | 로켓보일러",
    description: "경동나비엔·귀뚜라미·린나이 가스보일러 교체 비용과 설치 가격을 사진으로 먼저 확인하세요.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
  verification: { google: "Cp7SFz3tzpsMia6iRSQ5wZm59vKxIjiwg8yp0fLvObc" },
};

const localBusiness = {
  "@context": "https://schema.org",
  "@type": "HVACBusiness",
  name: "로켓보일러",
  url: siteUrl,
  description: "서울·경기·인천 가스보일러 교체 비용·설치 가격 사진 견적 전문",
  areaServed: ["서울특별시", "경기도", "인천광역시"],
  image: `${siteUrl}/og.png`,
  brand: ["경동나비엔", "귀뚜라미", "린나이"],
  knowsAbout: ["보일러 교체 비용", "가스보일러 교체", "콘덴싱 보일러 설치", "경동나비엔 보일러", "귀뚜라미 보일러", "신규 보일러 설치", "각방제어", "연통 및 배수구 설치 조건"],
  priceRange: "₩₩",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        {children}
        <BoilerFinder />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
      </body>
    </html>
  );
}

