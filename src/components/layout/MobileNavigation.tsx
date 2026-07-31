"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ctaNavigation, mainNavigation } from "@/data/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type MobileNavigationProps = {
  id: string;
  open: boolean;
  onClose: () => void;
};

export function MobileNavigation({ id, open, onClose }: MobileNavigationProps) {
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      firstLinkRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  return (
    <div
      id={id}
      className={cn(
        "site-mobile-nav lg:hidden fixed inset-0 z-10 bg-[var(--color-black)] transition-[opacity,visibility] duration-300 motion-reduce:transition-none",
        open
          ? "visible opacity-100"
          : "invisible opacity-0 pointer-events-none",
      )}
      aria-hidden={!open}
      inert={!open}
    >
      <nav
        className="site-mobile-nav-panel"
        aria-label="Mobile Navigation"
      >
        <ul className="site-mobile-nav-list">
          {mainNavigation.map((item, index) => (
            <li key={item.href}>
              <Link
                ref={index === 0 ? firstLinkRef : undefined}
                href={item.href}
                className="nav-link-mobile block py-2.5 font-[family-name:var(--font-heading)] text-[clamp(1.5rem,7vw,2.35rem)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-violet)] sm:py-3"
                onClick={onClose}
                tabIndex={open ? undefined : -1}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="site-mobile-nav-cta" onClick={onClose}>
          <Button href={ctaNavigation.href} variant="primary" size="lg">
            {ctaNavigation.label}
          </Button>
        </div>
      </nav>
    </div>
  );
}
