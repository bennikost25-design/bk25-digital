"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ctaNavigation, mainNavigation } from "@/data/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { MobileNavigation } from "./MobileNavigation";

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const scrollLockYRef = useRef(0);

  if (pathname !== menuPath) {
    setMenuPath(pathname);
    if (menuOpen) setMenuOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    if (!menuOpen) return;

    const scrollY = scrollLockYRef.current;
    const { body, documentElement } = document;
    const previous = {
      bodyOverflow: body.style.overflow,
      htmlOverflow: documentElement.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      htmlScrollBehavior: documentElement.style.scrollBehavior,
    };

    documentElement.style.scrollBehavior = "auto";
    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      body.style.overflow = previous.bodyOverflow;
      documentElement.style.overflow = previous.htmlOverflow;
      body.style.position = previous.bodyPosition;
      body.style.top = previous.bodyTop;
      body.style.width = previous.bodyWidth;
      documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, scrollY);
      documentElement.style.scrollBehavior = previous.htmlScrollBehavior;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) {
      if (wasOpenRef.current) {
        menuButtonRef.current?.focus({ preventScroll: true });
      }
      wasOpenRef.current = false;
      return;
    }

    wasOpenRef.current = true;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const toggleMenu = () => {
    setMenuOpen((open) => {
      if (!open) scrollLockYRef.current = window.scrollY;
      return !open;
    });
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/*
        Backdrop blur must NOT wrap the mobile overlay: it creates a containing
        block for position:fixed descendants and would shrink the menu to the
        header bar height.
      */}
      <div
        className={cn(
          "surface-dark relative z-20 transition-[background-color,backdrop-filter,padding] duration-300",
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
            ref={menuButtonRef}
            type="button"
            className="lg:hidden relative z-30 flex h-11 w-11 items-center justify-center rounded-sm text-[var(--color-white)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--color-violet)]"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? "Menü schließen" : "Menü öffnen"}
            onClick={toggleMenu}
          >
            <span className="sr-only">Menü</span>
            <span className="flex w-6 flex-col gap-1.5" aria-hidden="true">
              <span
                className={cn(
                  "block h-0.5 w-full bg-current transition-transform duration-200 origin-center motion-reduce:transition-none",
                  menuOpen && "translate-y-[4px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "block h-0.5 w-full bg-current transition-opacity duration-200 motion-reduce:transition-none",
                  menuOpen && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "block h-0.5 w-full bg-current transition-transform duration-200 origin-center motion-reduce:transition-none",
                  menuOpen && "-translate-y-[4px] -rotate-45",
                )}
              />
            </span>
          </button>
        </div>
      </div>

      <MobileNavigation id={menuId} open={menuOpen} onClose={closeMenu} />
    </header>
  );
}
