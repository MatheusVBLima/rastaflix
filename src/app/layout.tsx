import {
  Geist,
  Geist_Mono,
  JetBrains_Mono,
  Kalam,
  Lora,
  Plus_Jakarta_Sans,
  Space_Grotesk,
  Unbounded,
} from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
import { ptBR } from "@clerk/localizations";
import { HeaderShell } from "@/components/HeaderShell";
import { ThemeProvider } from "@/components/provider/ThemeProvider";
import Providers from "@/components/provider/Providers";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { siteMetadata } from "@/lib/site-metadata";
import { paletteInitScript } from "@/lib/palettes";
import { fontInitScript } from "@/lib/fonts";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin"],
  weight: ["700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const fontVariables = [
  geistSans.variable,
  geistMono.variable,
  unbounded.variable,
  kalam.variable,
  plusJakartaSans.variable,
  spaceGrotesk.variable,
  lora.variable,
  jetbrainsMono.variable,
].join(" ");

export const metadata = siteMetadata;

/**
 * Application root layout that wraps pages with global providers, theme configuration, and shared UI chrome.
 *
 * Renders the top-level HTML structure including head meta, font variables on the root element, authentication and app providers,
 * the themed UI container with the site header, the `main` region where `children` are rendered, a toast container, and performance insights.
 *
 * @param children - The page content to render inside the layout's main region.
 * @returns The complete root HTML element tree for the application.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider dynamic appearance={{ theme: shadcn }} localization={ptBR}>
      <html lang="pt-BR" className={fontVariables} suppressHydrationWarning>
        <head>
          <link rel="icon" href="/favicon.png" sizes="32x32" />
          <meta httpEquiv="Permissions-Policy" content="interest-cohort=()" />
          {/* Aplica a paleta e a fonte salvas antes da pintura (sem piscar). */}
          <script dangerouslySetInnerHTML={{ __html: paletteInitScript + fontInitScript }} />
        </head>
        <body className="antialiased">
          <Providers>
            <NuqsAdapter>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
              >
                <a
                  href="#conteudo"
                  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:ring-2 focus:ring-ring"
                >
                  Pular para o conteúdo
                </a>
                <div className="flex min-h-screen flex-col">
                  <HeaderShell />
                  <main id="conteudo" className="flex-1 overflow-x-clip">
                    {children}
                  </main>
                  <Footer />
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
