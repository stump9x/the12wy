import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";
import { PlannerProvider } from "@/components/planner-provider";
import { PlannerAppShell } from "@/components/planner-app-shell";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "The 12 Week Year",
  description:
    "Công cụ thực thi theo chu kỳ 12 tuần: lập kế hoạch, chặn lịch, chấm điểm và đánh giá.",
  openGraph: {
    title: "12 Week Year",
    description: "Biến mục tiêu thành hành động mỗi tuần",
    type: "website",
    locale: "vi_VN",
    images: [{ url: "/og.png", width: 1680, height: 945, alt: "12 Week Year" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "12 Week Year",
    description: "Biến mục tiêu thành hành động mỗi tuần",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f5ef",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body>
        <PlannerProvider>
          <PlannerAppShell>{children}</PlannerAppShell>
          <PwaRegister />
        </PlannerProvider>
      </body>
    </html>
  );
}
