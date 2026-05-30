'use client';

import Link from 'next/link';
import { useI18n } from '@/store/i18n-store';
import { Brain, Github, Twitter, Linkedin, Mail } from 'lucide-react';

export function Footer() {
  const { t, dir } = useI18n();

  return (
    <footer dir={dir} className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  {t.common.appName}
                </span>
              </Link>
              <p className="mt-4 text-sm text-muted-foreground max-w-xs">
                {t.common.appDescription}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
                  aria-label="Email"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t.landing.features}</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t.landing.feature1Title}
                  </Link>
                </li>
                <li>
                  <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t.landing.feature2Title}
                  </Link>
                </li>
                <li>
                  <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t.landing.feature3Title}
                  </Link>
                </li>
                <li>
                  <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t.landing.feature4Title}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t.footer.about}</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t.footer.about}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t.footer.contact}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t.footer.help}
                  </Link>
                </li>
                <li>
                  <Link href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t.landing.pricing}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t.common.settings}</h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t.footer.privacy}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t.footer.terms}
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {t.footer.contact}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {t.common.appName}. {t.footer.rights}.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5 text-teal-500" />
            {t.common.poweredBy}
          </p>
        </div>
      </div>
    </footer>
  );
}
