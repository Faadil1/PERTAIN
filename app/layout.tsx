import type { Metadata } from "next";
import "./globals.css";
import "./trace-final.css";

export const metadata: Metadata = {
  title: "PERTAIN — Per-customer incident truth gate",
  description: "One statement. Three customer truths. Know who this update actually applies to before it goes out.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
