// app/layout.tsx
import "./globals.css";
import { Amiri } from "next/font/google";

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
  adjustFontFallback: false,
});

export const metadata = {
  title: "Survey Click Counter",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={amiri.className}>{children}</body>
    </html>
  );
}
