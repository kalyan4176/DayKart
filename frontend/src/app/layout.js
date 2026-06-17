import { Outfit } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/components/StoreProvider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Daykart | Premium Multi-Vendor E-Commerce Platform",
  description: "Experience lag-free, ultra-secure, and modern e-commerce shopping. Shop top-brand electronics, custom fashion, and kitchen appliances with smart recommendations and fast checkout.",
  openGraph: {
    title: "Daykart | Premium Multi-Vendor E-Commerce Platform",
    description: "Shop high-quality tech, clothing, and home products on the Daykart online marketplace.",
    type: "website",
    locale: "en_US",
    siteName: "Daykart",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-300">
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
