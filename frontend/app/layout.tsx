import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MissionProvider } from "@/components/session/MissionContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "fordgeBurg — Antarctic Maritime Decision Support",
  description: "Basic UI prototype: mission planning, route comparison, risk review.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MissionProvider>{children}</MissionProvider>
      </body>
    </html>
  );
}
