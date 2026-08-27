import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { Toaster } from "react-hot-toast";
import { ExtractionProvider } from "./ExtractionContext";
import SessionEnforcer from "@/components/SessionEnforcer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CRM System",
  description: "Advanced CRM with PostgreSQL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="dark">
      <body className={`${inter.className} bg-gray-900 text-gray-100 min-h-screen flex flex-col`}>
        <AuthProvider>
          <ExtractionProvider>
            <SessionEnforcer />
            <Toaster position="top-right" />
            {children}
          </ExtractionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
