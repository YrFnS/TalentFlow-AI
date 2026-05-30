import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { I18nDirectionHandler } from "@/components/providers/i18n-direction-handler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TalentFlow AI - AI-Powered HR & ATS Platform",
  description: "The next-generation HR & ATS platform powered by AI. Streamline your hiring process, find the best candidates, and make data-driven decisions.",
  keywords: ["HR", "ATS", "AI", "Hiring", "Recruitment", "TalentFlow", "OpenRouter"],
  icons: {
    icon: "/logo.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the CSP nonce from the middleware-set response header.
  // This allows client components to access the nonce via the meta tag
  // for adding nonce attributes to dynamically created script tags.
  const headersList = await headers();
  const nonce = headersList.get("x-csp-nonce") || "";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Expose CSP nonce to client-side code via meta tag */}
        {nonce && <meta name="csp-nonce" content={nonce} />}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nDirectionHandler />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
