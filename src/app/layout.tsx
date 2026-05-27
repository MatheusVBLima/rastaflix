import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { HeaderShell } from "@/components/HeaderShell";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/provider/ThemeProvider";
import Providers from "@/components/provider/Providers";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rastaflix",
  description: "Acompanhe a saga do nosso rastafari mineiro",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider dynamic>
      <html lang="pt-BR" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/favicon.png" sizes="32" />
          <meta httpEquiv="Permissions-Policy" content="interest-cohort=()" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Providers>
            <NuqsAdapter>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
              themes={[
                "light",
                "dark",
                "system",
                "vercel",
                "cosmic",
                "tangerine",
                "maconha",
              ]}
            >
              <div className="flex flex-col min-h-screen">
                <Suspense fallback={<Header isAdmin={false} />}>
                  <HeaderShell />
                </Suspense>
                <main className="flex-1">{children}</main>
              </div>
              <Toaster />
            </ThemeProvider>
            </NuqsAdapter>
          </Providers>
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
