import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Tsuzuri",
    template: "%s | Tsuzuri"
  },
  description: "Tsuzuri nail appointment and salon management system",
  applicationName: "Tsuzuri"
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
