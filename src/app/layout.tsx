import type { Metadata } from "next";
import { Inter, Open_Sans } from "next/font/google";
import "./globals.css";
import { PrismaAdapter } from "@auth/prisma-adapter";

const openSans = Open_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Global Scholar - Education Tracking System",
  description: "Miscio connects you to world-class Christian higher education, a wide professional network, and opportunities for collaboration and development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={openSans.className}>
        <div className="bg-slate-50 min-h-screen">
          <main className="p-0">{children}</main>
        </div>
      </body>
    </html>
  );
}

