import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Script from "next/script";
import { Fraunces, Manrope, IBM_Plex_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/motion/PageTransition";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono-reading",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata = {
  title: "Meterly",
  description: "Usage metering and billing infrastructure for SaaS APIs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body>
        {/* Razorpay Checkout Script */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />

        <AuthProvider>
          <Navbar />
          <PageTransition>{children}</PageTransition>
        </AuthProvider>
      </body>
    </html>
  );
}
