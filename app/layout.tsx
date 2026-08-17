import type { Metadata, Viewport } from "next";
import { Press_Start_2P } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const pixel = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--font-pixel" });

export const metadata: Metadata = {
  title: "DUH",
  description: "One day at a time.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "DUH" },
};

export const viewport: Viewport = {
  themeColor: "#171220",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={pixel.variable}>
      <body>
        {children}
        <Script id="register-worker" strategy="afterInteractive">
          {`if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');`}
        </Script>
      </body>
    </html>
  );
}
