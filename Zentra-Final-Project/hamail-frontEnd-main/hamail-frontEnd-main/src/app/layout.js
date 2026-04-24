import { Inter, Figtree, Montserrat } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const generateMetadata = async () => {
  return {
    title:
      "Zentra | Trading Psychology Tool - Become the Trader You're Meant to Be",
    description:
      "Your psychology, your edge — track, adapt, and outperform with insight that grows your confidence and your profits. Zentra turns your trade history into behavioural insight.",
    icons: {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", type: "image/x-icon" },
      ],
      shortcut: "/favicon.ico",
    },
    keywords:
      "trading psychology tool, improve trader mindset, behavioural trading app, emotion tracking for traders, trade journal meets mindset, mental edge in trading, trade plan compliance software",
    authors: [{ name: "Zentra Team" }],
    creator: "Zentra",
    publisher: "Zentra",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL("https://zentra.app"),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title:
        "Zentra | Trading Psychology Tool - Become the Trader You're Meant to Be",
      description:
        "Your psychology, your edge — track, adapt, and outperform with insight that grows your confidence and your profits.",
      url: "https://zentra.app",
      siteName: "Zentra",
      images: [
        {
          url: "/zentra-og.png",
          width: 1200,
          height: 630,
          alt: "Zentra - Trading Psychology Tool",
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title:
        "Zentra | Trading Psychology Tool - Become the Trader You're Meant to Be",
      description:
        "Your psychology, your edge — track, adapt, and outperform with insight that grows your confidence and your profits.",
      images: ["/zentra-og.png"],
    },
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
    category: "finance",
    classification: "trading",
    other: {
      "application/ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Zentra",
        description:
          "Trading psychology tool that analyzes trade data to provide behavioral insights and mental state detection for traders.",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        url: "https://zentra.app",
      }),
    },
  };
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${figtree.variable} ${montserrat.variable} antialiased`}
      >
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
