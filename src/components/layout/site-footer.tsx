import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-subtle">
      <Container className="grid gap-12 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs space-y-4">
          <Logo />
          <p className="text-sm leading-relaxed text-ink-muted">{siteConfig.description}</p>
        </div>
        {siteConfig.footerNav.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="mb-4 font-sans text-xs font-medium tracking-[0.18em] text-ink-muted uppercase">
              {group.title}
            </h2>
            <ul className="space-y-3">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-soft transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <div className="border-t border-line">
        <Container className="flex flex-col gap-2 py-6 text-xs text-ink-muted sm:flex-row sm:justify-between">
          <p>© {siteConfig.name}. A portfolio project.</p>
          <p>Payments run in Stripe test mode. No real charges are made.</p>
        </Container>
      </div>
    </footer>
  );
}
