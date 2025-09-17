import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Appbar from "@/components/Appbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TradePro - Advanced CFD Trading Platform",
  description:
    "TradePro is a modern CFD trading platform offering real-time charts, fast execution, advanced order types, and a secure trading experience. Start trading with confidence today.",
  keywords: [
    "CFD trading",
    "TradePro",
    "online trading platform",
    "crypto CFD",
    "forex CFD",
    "stock CFD",
    "real-time charts",
    "leverage trading",
    "secure trading",
    "advanced order types",
  ],
  authors: [{ name: "TradePro" }],
  icons: {
    icon: "/favicon.ico",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Appbar />
        {children}
        <Toaster />
        <Footer />
      </body>
    </html>
  );
}
