import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const amatry = localFont({
  src: "./amatry.otf",
  display: "swap",
  variable: "--font-amatry",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Edulink - Mémoire Scolaire",
  description: "Plateforme de gestion de ressources pédagogiques",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

import { ThemeProvider } from "@/components/theme-provider";
import { SessionTimeoutProvider } from "@/components/auth/SessionTimeoutProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${instrumentSerif.variable} ${amatry.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <SessionTimeoutProvider>
            {children}
          </SessionTimeoutProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
