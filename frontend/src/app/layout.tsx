import type { Metadata, Viewport } from "next";
import { Outfit, Work_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import HabitatCanvas from "@/components/three/HabitatCanvas";
import SiteHeader from "@/components/chrome/SiteHeader";
import SiteFooter from "@/components/chrome/SiteFooter";
import ScrollProgress from "@/components/chrome/ScrollProgress";
import MotionProvider from "@/components/motion/MotionProvider";

/* Verified pairing: "Geometric Modern" - Outfit headings, Work Sans body.
   JetBrains Mono carries measurements, coordinates and species codes. */
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Biophony — Acoustic Habitat Health Monitor",
  description:
    "Turn field recordings into a continuous habitat health signal. Species richness, expected-vs-observed range comparison, and an acoustic complexity index — trended per site over time.",
  keywords: [
    "bioacoustics",
    "passive acoustic monitoring",
    "biodiversity",
    "conservation",
    "soundscape ecology",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Zoom is never disabled (a11y).
  themeColor: "#f6fbf8",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      /* We set `scroll-behavior: smooth` globally for in-page anchor links.
         Next 16 no longer overrides that on route change unless asked, and
         without this attribute every navigation would slow-scroll to the top
         instead of jumping. */
      data-scroll-behavior="smooth"
      className={`${outfit.variable} ${workSans.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-dvh flex flex-col">
        <a href="#main" className="hb-skip">
          Skip to main content
        </a>

        {/* Interactive WebGL field. Fixed behind everything, pointer + scroll
            driven, and fully decorative so it is hidden from the a11y tree. */}
        <HabitatCanvas />

        <MotionProvider>
          <ScrollProgress />
          <SiteHeader />
          <main id="main" className="flex-1 relative" style={{ zIndex: 10 }}>
            {children}
          </main>
          <SiteFooter />
        </MotionProvider>
      </body>
    </html>
  );
}
