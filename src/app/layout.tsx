import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { Shell } from "@/components/shell";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const plex = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

const centreName = process.env.CENTRE_NAME ?? "Harbour Sailing Centre";

export const metadata: Metadata = {
  title: {
    default: "Harbour·OS — Sailing Centre Ops",
    template: "%s · Harbour·OS",
  },
  description:
    "Self-hosted operations hub for a sailing centre: live weather, on-the-water safety board, session schedule, fleet & maintenance, members.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${plex.variable}`}>
      <body className="font-sans">
        <Shell centreName={centreName}>{children}</Shell>
      </body>
    </html>
  );
}
