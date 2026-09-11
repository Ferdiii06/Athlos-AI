import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AntiDebugGuard from "./components/AntiDebugGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://athlos.web.id"),
  title: {
    default: "Athlos AI - Platform Asisten AI Cerdas Gratis Tanpa Limit Indonesia",
    template: "%s | Athlos AI",
  },
  description:
    "Athlos AI adalah asisten kecerdasan buatan Indonesia gratis tanpa limit. Dilengkapi penalaran mendalam (Deep Reasoning), generator gambar Flux HD, studi multi-audiens, dan analisa dokumen cepat karya Ferdi (PENS).",
  keywords: [
    "AI Gratis",
    "AI Tanpa Limit",
    "Athlos AI",
    "Chatbot AI Indonesia",
    "DeepSeek R1 Indonesia",
    "ChatGPT Gratis Tanpa Login",
    "AI Image Generator Flux Gratis",
    "AI Mahasiswa PENS",
    "Ferdi Athlos AI",
  ],
  authors: [{ name: "Ferdi (PENS)", url: "https://ferdiansyah.web.id" }],
  creator: "Ferdi",
  publisher: "Athlos AI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "googlee95d2f60160e679a",
  },
  openGraph: {
    title: "Athlos AI - Asisten AI Cerdas Gratis Tanpa Limit",
    description:
      "Akses kecerdasan buatan super cerdas tanpa batas kuota. Ditenagai model penalaran mendalam, studio gambar artistik, dan pembuat dokumen otomatis.",
    url: "https://athlos.web.id",
    siteName: "Athlos AI",
    images: [
      {
        url: "/Athlos%20AI.png",
        width: 1200,
        height: 630,
        alt: "Athlos AI - Asisten AI Indonesia",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Athlos AI - Asisten AI Cerdas Gratis Tanpa Limit",
    description: "Coba Athlos AI gratis tanpa limit: Deep Reasoning, Gambar Flux HD, & Pembelajaran Cerdas.",
    creator: "@knownasferr",
    images: ["/Athlos%20AI.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/Athlos%20AI.png",
    apple: "/Athlos%20AI.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Athlos AI",
  },
};

export const viewport = {
  themeColor: "#161312",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Athlos AI",
  operatingSystem: "All",
  applicationCategory: "UtilitiesApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "IDR",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "1280",
    bestRating: "5",
  },
  author: {
    "@type": "Person",
    name: "Ferdi",
    url: "https://ferdiansyah.web.id",
  },
  description:
    "Asisten AI Indonesia gratis tanpa limit dengan penalaran mendalam, studio gambar artistik, dan adaptasi audiens multigenerasi.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="h-full w-full m-0 p-0" suppressHydrationWarning>
        <AntiDebugGuard />
        {children}
      </body>
    </html>
  );
}
