import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
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
  title: "Checkout | Tourealo",
};

export default async function CheckoutLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings = await fetchSettings().catch<Settings>(() => ({
    appName: "Tourealo",
    availableLanguages: [],
    availableCurrencies: [],
  }));
  // Sanitize settings before passing to client provider
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
  const availableLanguages = getAvailableLanguages(settings.availableLanguages, settings.defaultLanguage);
  const explicitDefaultLanguage = normalizeLanguage(settings.defaultLanguage);
  const fallbackLanguage = getFallbackLanguage(settings.defaultLanguage, availableLanguages);
  const language = await detectLanguage({ availableLanguages, fallbackLanguage });
  const initialNamespaces = await fetchNamespaces(language, ["frontend-common", "frontend-navbar", "frontend-footer"]);

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
                  {/* NOTE: Intentionally no Header/Footer here so checkout is isolated */}
                  {children}
                </AuthProvider>
              </TranslationProvider>
            </LanguageProvider>
          </SettingsProvider>
        </LanguageServerProvider>
      </body>
    </html>
  );
}
