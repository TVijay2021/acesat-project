import type { Metadata, Viewport } from "next";
import { Sora, Work_Sans } from "next/font/google";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-work-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Beacon — Offline SAT Coach",
  description:
    "Beacon analyses your practice, packs a training route you can work through offline, then checks whether its own advice held.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Beacon", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4ec" },
    { media: "(prefers-color-scheme: dark)", color: "#141a24" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sora.variable} ${workSans.variable}`}>
      <body className="font-sans min-h-dvh">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
