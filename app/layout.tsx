import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://rocketboiler.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "서울·경기 보일러 교체·설치 비용 | 로켓보일러", template: "%s | 로켓보일러" },
  description: "서울·경기·인천 가정용 보일러 교체·신규 설치. 경동나비엔·귀뚜라미 취급, 평수별 설치 비용과 사진 견적, 당일 방문 가능 여부를 안내합니다.",
  keywords: ["서울 보일러 교체", "경기 보일러 교체", "인천 보일러 설치", "보일러 설치 비용", "당일 보일러 설치", "경동나비엔 보일러 교체", "귀뚜라미 보일러 설치", "보일러 사진 견적"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "로켓보일러",
    title: "서울·경기 보일러 교체·설치 비용 | 로켓보일러",
    description: "경동나비엔·귀뚜라미 보일러 교체와 신규 설치. 사진으로 설치 비용과 당일 방문 가능 여부를 먼저 확인하세요.",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "로켓보일러 서울·경기 보일러 교체·설치" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "서울·경기 보일러 교체·설치 비용 | 로켓보일러",
    description: "경동나비엔·귀뚜라미 보일러 교체와 신규 설치. 사진으로 설치 비용과 당일 방문 가능 여부를 먼저 확인하세요.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
};

const localBusiness = {
  "@context": "https://schema.org",
  "@type": "HVACBusiness",
  name: "로켓보일러",
  url: siteUrl,
  description: "서울·경기 가정용 보일러 교체·설치 전문",
  areaServed: ["서울특별시", "경기도", "인천광역시"],
  image: `${siteUrl}/og.png`,
  brand: ["경동나비엔", "귀뚜라미"],
  knowsAbout: ["가정용 보일러 교체", "신규 보일러 설치", "보일러 이전 설치", "각방제어", "연통 및 배수구 설치 조건"],
  priceRange: "₩₩",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
      </body>
    </html>
  );
}

