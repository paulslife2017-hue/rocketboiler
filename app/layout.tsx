import type { Metadata } from "next";
import "./globals.css";
import "./contact-actions.css";
import ConsultationWidget from "./components/ConsultationWidget";

const siteUrl = "https://rocketboiler.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "로켓보일러 | 서울·경기·인천 보일러 교체·설치 상담", template: "%s | 로켓보일러" },
  description: "서울·경기·인천 가스보일러 교체·설치 상담. 기존 모델, 연통·배관·배수구와 각방제어 조건을 확인하고 작업 범위와 비용을 안내합니다. 상담 010-5858-9975.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "로켓보일러",
    title: "로켓보일러 | 서울·경기·인천 보일러 교체·설치 상담",
    description: "기존 모델과 설치 조건을 확인해 가스보일러 교체·설치 범위와 비용을 안내합니다. 상담 010-5858-9975.",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "로켓보일러 서울·경기 보일러 교체·설치" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "로켓보일러 | 서울·경기·인천 보일러 교체·설치 상담",
    description: "기존 모델과 설치 조건을 확인해 가스보일러 교체·설치 범위와 비용을 안내합니다. 상담 010-5858-9975.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
  verification: {
    google: "Cp7SFz3tzpsMia6iRSQ5wZm59vKxIjiwg8yp0fLvObc",
    other: { "naver-site-verification": ["7744996afa5773d3ec1ce39c4458f482b3229889", "47e912b1460b702cf880b5caeb55db316a449064"] },
  },
};

const localBusiness = {
  "@context": "https://schema.org",
  "@type": ["Organization", "HVACBusiness"],
  "@id": `${siteUrl}/#organization`,
  name: "로켓보일러",
  legalName: "보일러 마스터",
  url: siteUrl,
  description: "서울·경기·인천 가정용 가스보일러 교체·설치 비용 상담",
  telephone: "+82-10-5858-9975",
  sameAs: ["https://naver.me/5kPfx737", "https://blog.naver.com/rocketboiler_"],
  address: { "@type": "PostalAddress", streetAddress: "시흥대로 97, 26동 2층 202호 (시흥동, 시흥유통상가)", addressLocality: "금천구", addressRegion: "서울특별시", addressCountry: "KR" },
  areaServed: ["서울특별시", "군포시", "안양시", "과천시", "광명시", "부천시", "시흥시", "안산시", "고양시", "구리시", "하남시", "성남시", "인천광역시(강화군·영종도 제외)"],
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
        <ConsultationWidget />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
      </body>
    </html>
  );
}

