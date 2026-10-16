import type { Metadata, Viewport } from "next";
import {
  Inter,
  Bricolage_Grotesque,
  JetBrains_Mono,
  Instrument_Serif,
} from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/components/auth-provider";
import { ToastProvider } from "@/components/toast";
import { ConfirmProvider } from "@/components/confirm-dialog";
import { AudioProvider } from "@/components/audio-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { IntroV2 } from "@/components/intro-v2";
import { CommandPalette } from "@/components/command-palette";
import { PwaRegister } from "@/components/pwa-register";
import { NotificationsManager } from "@/components/notifications-manager";
import { CloudSync } from "@/components/cloud-sync";
import { BackToTop } from "@/components/back-to-top";
import { Atmosphere } from "@/components/atmosphere";
import { AiChat } from "@/components/ai-chat";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["italic", "normal"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SYTHERIS — Anime Keşif",
  description: "Kişisel anime keşif ve araştırma platformu",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SYTHERIS",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#00E676",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} ${bricolage.variable} ${mono.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <body className="pb-16 md:pb-0">
        <ThemeProvider>
          <Providers>
            <ToastProvider>
              <ConfirmProvider>
                <AuthProvider>
                  <AudioProvider>
                    <Atmosphere />
                    <IntroV2 />
                    <CommandPalette />
                    <PwaRegister />
                    <NotificationsManager />
                    <CloudSync />
                    <SiteHeader />
                    <div className="min-h-[60vh]">{children}</div>
                    <SiteFooter />
                    <BackToTop />
                    <AiChat />
                    <Analytics />
                    <SpeedInsights />
                  </AudioProvider>
                </AuthProvider>
              </ConfirmProvider>
            </ToastProvider>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}