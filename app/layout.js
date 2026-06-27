import "./globals.css";
import "react-quill/dist/quill.snow.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Playfair_Display, DM_Sans, DM_Mono } from "next/font/google";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Editorial high-contrast serif used for the wordmark, headings, and italics
// (matches the design mockups). Exposed as --font-serif so all existing CSS
// keeps working unchanged.
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"]
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"]
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"]
});

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "KastoChha - Nepal ko Real Talk",
  description:
    "Real opinions from real people across Nepal. Honest experiences on products, services, careers, and everyday life - no paid hype.",
  openGraph: {
    title: "KastoChha - Nepal ko Real Talk",
    description: "Community powered opinions from across Nepal.",
    url: siteUrl,
    siteName: "KastoChha",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "KastoChha - Nepal ko Real Talk",
    description: "Community powered opinions from across Nepal."
  }
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable}`}>
          <a href="#main" className="sr-only focus:not-sr-only" style={{position:'absolute',left:8,top:8,zIndex:10000,background:'#fff',padding:'6px 8px',borderRadius:6}}>Skip to content</a>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "KastoChha",
            "url": siteUrl,
            "description": "Community powered opinions from across Nepal."
          }) }} />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
