import type { Metadata } from "next";
import { PlayerProvider } from "@/components/PlayerProvider";
import { AppShell } from "@/components/AppShell";
import "./globals.css";
import "./gameplay.css";

export const metadata: Metadata = {
  title: "Typing Arena — Find your flow",
  description:
    "Race, battle, and box with every keystroke. Three playable typing games, one keyboard. Free browser gameplay with local personal records.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <PlayerProvider>
          <AppShell>{children}</AppShell>
        </PlayerProvider>
      </body>
    </html>
  );
}
