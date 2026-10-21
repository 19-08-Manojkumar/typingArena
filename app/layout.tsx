import type { Metadata, Viewport } from "next";
import { PlayerProvider } from "@/components/PlayerProvider";
import { AppShell } from "@/components/AppShell";
import "./globals.css";
import "./gameplay.css";
import "./racing.css";
import "./boxing.css";
import "./battle-roster.css";

const title = "Typing Arena — Find your flow";
const description =
  "Race, battle, and box with every keystroke. Three playable typing games, one keyboard. Free browser gameplay with local personal records.";

export const metadata: Metadata = {
  title: { default: title, template: "%s | Typing Arena" },
  description,
  applicationName: "Typing Arena",
  authors: [{ name: "Manojkumar", url: "https://manojkumar-dev.vercel.app/" }],
  keywords: ["typing games", "typing practice", "typing speed", "WPM", "Typing Arena"],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Typing Arena",
    title,
    description,
  },
  twitter: { card: "summary", title, description },
};

export const viewport: Viewport = {
  themeColor: "#0b0e15",
  colorScheme: "dark",
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
