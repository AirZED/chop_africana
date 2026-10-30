import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The brand serif is "Playfair" (a variable font with optical-size + width axes),
// not the more common "Playfair Display" — they're distinct Google Font families.
const playfair = Playfair({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz", "wdth"],
});

const TITLE = "Chop Africana | 5 Ready-to-Bake Pies, Straight From Your Freezer To Your Oven";
const DESCRIPTION =
  "Authentic Nigerian pies, no preservatives or additives. Order online or pick them up at a supermarket near you.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.chopafricana.com"),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "Chop Africana",
    images: [{ url: "/food/homeimg.png", width: 917, height: 842, alt: "Chop Africana beef pie" }],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/food/homeimg.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#1c1917",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone-100">{children}</body>
    </html>
  );
}
