import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Domo | A new way home",
  description: "An accessible path to having a home and building for your future.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
