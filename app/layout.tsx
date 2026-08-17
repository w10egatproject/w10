import type { Metadata } from "next";
import { Prompt, Geist } from "next/font/google";
import "./globals.css";
import ShellMigrationGate from "@/components/layout/ShellMigrationGate";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const prompt = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-prompt",
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
      className={cn("h-full", "antialiased", prompt.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col"><ShellMigrationGate>{children}</ShellMigrationGate></body>
    </html>
  );
}
