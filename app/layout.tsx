import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";



const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ZugFlow",
  description: "Gestionale per appuntamenti",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
return (
  <html lang="en">
    <body className={inter.className}>
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 overflow-y-auto min-h-0">

          {children}
        </div>
      </div>
    </body>
  </html>
);

}
