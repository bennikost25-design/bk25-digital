"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { ctaNavigation, mainNavigation } from "@/data/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { MobileNavigation } from "./MobileNavigation";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 surface-dark transition-[background-color,backdrop-filter,padding] duration-300",
        scrolled || menuOpen
          ? "bg-[var(--color-black)]/95 backdrop-blur-md py-3"
          : "bg-[var(--color-black)]/72 backdrop-blur-sm py-5",
      )}
    >
      <div className="container-site flex items-center justify-between gap-6">
        <Logo tone="light" variant="compact" />

        <nav
          className="hidden lg:flex items-center gap-9"
          aria-label="Hauptnavigation"
        >
          {mainNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="nav-link font-[family-name:var(--font-heading)] text-sm tracking-wide"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Button href={ctaNavigation.href} variant="primary" size="md">
            {ctaNavigation.label}
          </Button>
        </div>

        <button
          type="button"
          className="lg:hidden relative z-50 flex h-11 w-11 items-center justify-center rounded-sm text-[var(--color-white)]"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sr-only">Menü</span>
          <span className="flex w-6 flex-col gap-1.5" aria-hidden="true">
            <span
              className={cn(
                "block h-0.5 w-full bg-current transition-transform duration-200 origin-center",
                menuOpen && "translate-y-[4px] rotate-45",
              )}
            />
            <span
              className={cn(
                "block h-0.5 w-full bg-current transition-opacity duration-200",
                menuOpen && "opacity-0",
              )}
            />
            <span
              className={cn(
                "block h-0.5 w-full bg-current transition-transform duration-200 origin-center",
                menuOpen && "-translate-y-[4px] -rotate-45",
              )}
            />
          </span>
        </button>
      </div>

      <MobileNavigation
        id={menuId}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
    </header>
  );
}
