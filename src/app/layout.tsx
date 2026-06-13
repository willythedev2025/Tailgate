import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Clubhouse — Sports Pools",
  description: "Play pick'em, survivor, and golf pools with your crew.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="en" className={`h-full ${playfair.variable}`}>
      <body className="h-full antialiased" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
