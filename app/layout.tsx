import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HackerRank Scraper",
  description: "Scrape HackerRank contest leaderboards",
  icons: {
    icon: "/image.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className="
          min-h-screen
          bg-[#f5f5f5]
          flex
          items-center
          justify-center
          p-5
          font-sans
        "
      >
        {children}
      </body>
    </html>
  );
}
