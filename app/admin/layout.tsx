import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "상담 관리자",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

