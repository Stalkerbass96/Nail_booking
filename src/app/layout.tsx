import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Nail Booking",
    template: "%s | Nail Booking"
  },
  description: "Single-store nail appointment and salon management system",
  applicationName: "Nail Booking"
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
