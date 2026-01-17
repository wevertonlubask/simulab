import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Simulab - Sua evolução em cada questão",
    template: "%s | Simulab",
  },
  description:
    "Plataforma de simulados para certificações profissionais. Cisco, AWS, Microsoft, CompTIA e muito mais.",
  keywords: [
    "simulados",
    "certificações",
    "cisco",
    "aws",
    "microsoft",
    "comptia",
    "provas",
    "questões",
  ],
  authors: [{ name: "Simulab" }],
  creator: "Simulab",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Simulab",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Simulab",
    title: "Simulab - Sua evolução em cada questão",
    description:
      "Plataforma de simulados para certificações profissionais.",
  },
  twitter: {
    card: "summary",
    title: "Simulab - Sua evolução em cada questão",
    description:
      "Plataforma de simulados para certificações profissionais.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6366F1" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <InstallPrompt />
          <ServiceWorkerRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
