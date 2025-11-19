import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { fetchSettings } from "@/services/settings";
import { SettingsProvider } from "@/providers/SettingsProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { detectLanguage, getAvailableLanguages, getFallbackLanguage } from "@/lib/language-server";
import { normalizeLanguage } from "@/lib/language-shared";
import type { Settings } from "@/types/settings";
import { TranslationProvider } from "@/providers/TranslationProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { fetchNamespaces } from "@/services/i18n";
import { LanguageServerProvider } from "@/providers/LanguageServerContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tourealo.dev"),
  title: {
    default: "Tourealo | Marketplace de tours y experiencias",
    template: "%s | Tourealo",
  },
  description:
    "Descubre y reserva tours y actividades memorables en todo el mundo con disponibilidad en tiempo real, proveedores verificados y soporte 24/7.",
  keywords: [
    "tours",
    "experiencias",
    "actividades",
    "marketplace",
    "reservas",
    "viajes",
  ],
  openGraph: {
    type: "website",
    title: "Tourealo | Marketplace de tours y experiencias",
    description:
      "Reserva actividades únicas con proveedores verificados, políticas flexibles y confirmación inmediata.",
    url: "https://tourealo.dev",
    siteName: "Tourealo",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Tours y experiencias Tourealo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@tourealo",
    creator: "@tourealo",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await fetchSettings().catch<Settings>(() => ({
    appName: "Tourealo",
    availableLanguages: [],
    availableCurrencies: [],
  }));
  const availableLanguages = getAvailableLanguages(settings.availableLanguages, settings.defaultLanguage);
  const explicitDefaultLanguage = normalizeLanguage(settings.defaultLanguage);
  const fallbackLanguage = getFallbackLanguage(settings.defaultLanguage, availableLanguages);
  const language = await detectLanguage({ availableLanguages, fallbackLanguage });
  const initialNamespaces = await fetchNamespaces(language, ["frontend-common", "frontend-navbar", "frontend-footer"]);
  // Sanitize settings before sending to the client to avoid leaking secrets
  const s: any = settings as any;
  const publicSettings = {
    appName: s.appName,
    appLogo: s.appLogo,
    appIcon: s.appIcon,
    availableLanguages: s.availableLanguages || [],
    availableCurrencies: s.availableCurrencies || [],
    defaultLanguage: s.defaultLanguage,
    frontendUrl: s.frontendUrl,
    paypalEnabled: s.paypalEnabled,
    paypalClientId: s.paypalClientId,
    googleMapsApiKey: s.googleMapsApiKey ?? undefined,
    branding: {
      logoUrl: s.branding?.logoUrl,
      defaultCoverUrl: s.branding?.defaultCoverUrl,
    },
  } as unknown as Settings;

  return (
    <html lang={language}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-slate-900`}>
        <LanguageServerProvider
          value={{ language, defaultLanguage: explicitDefaultLanguage ?? "", fallbackLanguage, availableLanguages }}
        >
          <SettingsProvider initialSettings={publicSettings}>
            <LanguageProvider
              initialLanguage={language}
              availableLanguages={availableLanguages}
              defaultLanguage={explicitDefaultLanguage ?? ""}
              fallbackLanguage={fallbackLanguage}
            >
              <TranslationProvider language={language} initialNamespaces={initialNamespaces}>
                <AuthProvider>
                  <div className="flex min-h-screen flex-col">
                    <Header />
                    <main className="flex-1">{children}</main>
                    <Footer />
                  </div>
                </AuthProvider>
              </TranslationProvider>
            </LanguageProvider>
          </SettingsProvider>
        </LanguageServerProvider>
      </body>
    </html>
  );
}
