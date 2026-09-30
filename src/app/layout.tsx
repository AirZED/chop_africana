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

export const metadata: Metadata = {
  title: "Chop Africana | Proper Pies, Baked In Your Own Oven",
  description: "Beef and chicken pies, ready to go from freezer to oven. Order online or pick them up at a supermarket near you.",
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
