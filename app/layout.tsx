import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Menu Planner",
  description: "Plan your weekly meals and generate shopping lists",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-orange-50 text-gray-800" style={{ fontFamily: 'var(--font-geist), sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
