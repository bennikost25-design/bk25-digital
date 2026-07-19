"use client";

import Link from "next/link";
import { ctaNavigation, mainNavigation } from "@/data/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type MobileNavigationProps = {
  id: string;
  open: boolean;
  onClose: () => void;
};

export function MobileNavigation({ id, open, onClose }: MobileNavigationProps) {
  return (
    <div
      id={id}
      className={cn(
        "lg:hidden fixed inset-0 top-0 z-40 bg-[var(--color-black)] transition-[opacity,visibility] duration-300",
        open
          ? "visible opacity-100"
          : "invisible opacity-0 pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <nav
        className="flex h-full flex-col justify-center px-[var(--section-pad-x)] pt-20 pb-10"
        aria-label="Mobile Navigation"
      >
        <ul className="flex flex-col gap-1">
          {mainNavigation.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="nav-link-mobile block py-3 font-[family-name:var(--font-heading)] text-[clamp(1.75rem,8vw,2.5rem)]"
                onClick={onClose}
                tabIndex={open ? 0 : -1}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-10" onClick={onClose}>
          <Button href={ctaNavigation.href} variant="primary" size="lg">
            {ctaNavigation.label}
          </Button>
        </div>
      </nav>
    </div>
  );
}
