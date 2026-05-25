import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MobileShell from "@/components/layout/MobileShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sugar — Quality Knowledge",
  description: "Consume enriching content. Academic research, books, and podcasts — curated and made accessible.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <MobileShell>{children}</MobileShell>
      </body>
    </html>
  );
}
