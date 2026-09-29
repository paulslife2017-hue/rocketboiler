import type { Metadata } from "next";
import "./globals.css";
import "./contact-actions.css";
import ConsultationWidget from "./components/ConsultationWidget";

const siteUrl = "https://rocketboiler.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "보일러 교체비용·설치비용 가격표 | 로켓보일러", template: "%s | 로켓보일러" },
  description: "보일러 교체비용은 일반형 원룸 기준 60만원대부터. 귀뚜라미·린나이·경동나비엔 예상 가격과 추가 설치비 기준을 확인하고 서울·경기·인천 방문 상담을 받으세요.",
  keywords: ["보일러 교체 비용", "보일러 교체", "보일러 가격", "가스보일러 교체 비용", "보일러 설치 비용", "경동나비엔 보일러 교체", "귀뚜라미 보일러 교체", "린나이 보일러 교체", "콘덴싱 보일러 교체", "서울 보일러 교체", "군포 보일러 교체", "안양 보일러 교체", "과천 보일러 교체", "광명 보일러 교체", "부천 보일러 교체", "고양 보일러 교체", "구리 보일러 교체", "하남 보일러 교체", "성남 보일러 교체", "인천 보일러 설치", "보일러 사진 견적"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "로켓보일러",
    title: "보일러 교체비용·설치비용 가격표 | 로켓보일러",
    description: "일반형 원룸 기준 60만원대부터. 브랜드별 예상 가격과 기본 설치·추가 작업 기준을 확인하고 전화로 상담하세요.",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "로켓보일러 서울·경기 보일러 교체·설치" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "보일러 교체비용·설치비용 가격표 | 로켓보일러",
    description: "일반형 원룸 기준 60만원대부터. 브랜드별 예상 가격과 기본 설치·추가 작업 기준을 확인하고 전화로 상담하세요.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
  verification: {
    google: "Cp7SFz3tzpsMia6iRSQ5wZm59vKxIjiwg8yp0fLvObc",
    other: { "naver-site-verification": "7744996afa5773d3ec1ce39c4458f482b3229889" },
  },
};

const localBusiness = {
  "@context": "https://schema.org",
  "@type": "HVACBusiness",
  name: "로켓보일러",
  legalName: "보일러 마스터",
  url: siteUrl,
  description: "서울·경기·인천 가정용 가스보일러 교체·설치 비용 상담",
  telephone: "+82-10-5858-9975",
  address: { "@type": "PostalAddress", streetAddress: "시흥대로 97, 26동 2층 202호 (시흥동, 시흥유통상가)", addressLocality: "금천구", addressRegion: "서울특별시", addressCountry: "KR" },
  areaServed: ["서울특별시", "군포시", "안양시", "과천시", "광명시", "부천시", "고양시", "구리시", "하남시", "성남시", "인천광역시"],
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

