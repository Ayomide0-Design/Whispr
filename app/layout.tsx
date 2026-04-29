import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Whispr — Get anonymous messages from anyone",
  description: "Create a link. Share it. Find out what people really think.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
