import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from "@clerk/localizations";
import { Toaster } from "sonner";
import "./globals.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { default: "Inventário", template: "%s | Inventário" },
  description: "Cadastros e itens da sua empresa.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Inventário",
    statusBarStyle: "default",
  },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};
export const viewport: Viewport = {
  themeColor: "#047857",
  width: "device-width",
  initialScale: 1,
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      localization={ptBR}
      appearance={{
        elements: {
          userButtonTrigger: "min-h-11 min-w-11",
          organizationSwitcherTrigger: "min-h-11",
          formButtonPrimary: "min-h-11",
        },
      }}
    >
      <html lang="pt-BR">
        <body>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
