import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://rocket-boiler-kr.kbeuaty.chatgpt.site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "로켓보일러 | 서울·경기 당일 보일러 설치·교체", template: "%s | 로켓보일러" },
  description: "서울·경기 가정용 보일러 신규 설치·교체·이전 설치 전문. 사진으로 설치 조건과 비용을 먼저 확인하고 당일 방문 가능 여부를 안내해 드립니다.",
  keywords: ["보일러 설치", "보일러 신규 설치", "보일러 교체", "당일 보일러 설치", "서울 보일러 설치", "경기 보일러 설치", "보일러 설치 비용"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "로켓보일러",
    title: "로켓보일러 | 서울·경기 보일러 설치·교체",
    description: "신규 설치와 교체, 이전 설치의 당일 가능 여부를 먼저 확인해 드립니다.",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "로켓보일러 서울·경기 보일러 교체·설치" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "로켓보일러 | 서울·경기 보일러 설치·교체",
    description: "신규 설치와 교체, 이전 설치의 당일 가능 여부를 먼저 확인해 드립니다.",
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
