import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ShellMigrationGate from "@/components/layout/ShellMigrationGate";
import { cn } from "@/lib/utils";

const cmuFont = localFont({
  src: [
    {
      path: "../public/fonts/cmu/CMU-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/cmu/CMU-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/cmu/CMU-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/cmu/CMU-LightItalic.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/cmu/CMU-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/cmu/CMU-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-cmu",
  display: "swap",
});

export const metadata: Metadata = {
  title: "W10 Dashboard",
  description: "ระบบติดตามงานซ่อมและจัดซื้อ W10",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={cn("h-full", "antialiased", cmuFont.variable, "font-sans")}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ShellMigrationGate>{children}</ShellMigrationGate>
      </body>
    </html>
  );
}
