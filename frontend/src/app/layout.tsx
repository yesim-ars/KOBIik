import type { Metadata } from "next";
import "./globals.css";
import "./extra.css";
import "./dashboard.css";

export const metadata: Metadata = {
  title: "işeal — KOBİ’ler için işe alım platformu",
  description: "Doğru adayları ve KOBİ’lere uygun iş fırsatlarını keşfedin.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr"><body>{children}</body></html>;
}

