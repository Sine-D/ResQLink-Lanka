import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ResQLink Lanka | Disaster Early-Warning & Emergency Coordination",
  description:
    "National Smart Disaster Early-Warning & Emergency Coordination Platform for Sri Lanka",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
