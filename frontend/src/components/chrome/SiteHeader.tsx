"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Waves, Upload } from "lucide-react";
import { viewportState } from "@/lib/viewport-store";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/sites", label: "Sites" },
  { href: "/upload", label: "Upload" },
  { href: "/method", label: "Method" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  /* Condense the bar once the user leaves the hero. */
  useEffect(() => {
    let raf = 0;
    let condensed = false;
    const loop = () => {
      const el = headerRef.current;
      if (el && viewportState.visible) {
        const should = viewportState.scrollY > 40;
        if (should !== condensed) {
          condensed = should;
          el.dataset.condensed = should ? "true" : "false";
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* Close the mobile panel on route change. */
  useEffect(() => setOpen(false), [pathname]);

  /* Escape closes, and focus returns to the control that opened it. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      ref={headerRef}
      data-condensed="false"
      className="sticky top-0 group/header"
      style={{ zIndex: 40 }}
    >
      <div
        className="transition-all duration-300 border-b border-transparent
                   group-data-[condensed=true]/header:border-[var(--hb-border)]
                   group-data-[condensed=true]/header:bg-white/78
                   group-data-[condensed=true]/header:backdrop-blur-xl
                   group-data-[condensed=true]/header:shadow-[0_4px_24px_-12px_rgba(11,43,36,0.18)]"
        style={{ transitionTimingFunction: "var(--hb-ease-out)" }}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div
            className="flex items-center justify-between transition-all duration-300
                       h-[76px] group-data-[condensed=true]/header:h-[62px]"
          >
            {/* Wordmark */}
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-lg -m-1 p-1"
              aria-label="Biophony — home"
            >
              <span
                className="grid place-items-center size-9 rounded-xl shrink-0"
                style={{
                  background:
                    "linear-gradient(145deg, var(--hb-primary-hi), var(--hb-primary-lo))",
                  boxShadow: "var(--hb-shadow-glow)",
                }}
              >
                <Waves className="size-5" strokeWidth={2.25} color="#fff" aria-hidden="true" />
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-[family-name:var(--font-heading)] font-bold text-[17px] tracking-tight">
                  Biophony
                </span>
                <span className="text-[10.5px] uppercase tracking-[0.14em] text-[var(--hb-ink-muted)] font-medium">
                  Habitat Health
                </span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav aria-label="Primary" className="hidden md:block">
              <ul className="flex items-center gap-1">
                {NAV.map((item) => {
                  const active =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className="relative block px-3.5 py-2 rounded-lg text-[14.5px] font-medium
                                   text-[var(--hb-ink-soft)] hover:text-[var(--hb-primary-lo)]
                                   hover:bg-[var(--hb-bg-deep)]
                                   transition-colors duration-200
                                   aria-[current=page]:text-[var(--hb-primary-lo)]"
                      >
                        {item.label}
                        {active && (
                          <span
                            aria-hidden="true"
                            className="absolute left-3.5 right-3.5 -bottom-0.5 h-[2px] rounded-full"
                            style={{ background: "var(--hb-primary)" }}
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/upload"
                className="hb-sheen hidden sm:inline-flex items-center gap-2 rounded-xl px-4 py-2.5
                           text-[14px] font-semibold text-white
                           transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
                style={{
                  background:
                    "linear-gradient(145deg, var(--hb-primary-hi), var(--hb-primary))",
                  boxShadow: "var(--hb-shadow-glow)",
                  transitionTimingFunction: "var(--hb-ease-out)",
                }}
              >
                <Upload className="size-4" strokeWidth={2.25} aria-hidden="true" />
                Add recording
              </Link>

              <button
                ref={toggleRef}
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-controls="mobile-nav"
                aria-label={open ? "Close menu" : "Open menu"}
                className="md:hidden grid place-items-center size-11 rounded-xl
                           border border-[var(--hb-border)] bg-white/80 backdrop-blur
                           active:scale-95 transition-transform duration-150"
              >
                {open ? (
                  <X className="size-5" strokeWidth={2.25} aria-hidden="true" />
                ) : (
                  <Menu className="size-5" strokeWidth={2.25} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile panel */}
      <div
        id="mobile-nav"
        ref={panelRef}
        hidden={!open}
        className="md:hidden mx-4 mt-2 rounded-2xl hb-glass-deep overflow-hidden"
      >
        <nav aria-label="Primary (mobile)">
          <ul className="p-2">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className="flex items-center min-h-[48px] px-4 rounded-xl font-medium
                               text-[var(--hb-ink-soft)]
                               aria-[current=page]:bg-[var(--hb-bg-deep)]
                               aria-[current=page]:text-[var(--hb-primary-lo)]"
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="p-2 pt-3">
              <Link
                href="/upload"
                className="flex items-center justify-center gap-2 min-h-[48px] rounded-xl
                           font-semibold text-white"
                style={{
                  background:
                    "linear-gradient(145deg, var(--hb-primary-hi), var(--hb-primary))",
                }}
              >
                <Upload className="size-4" strokeWidth={2.25} aria-hidden="true" />
                Add recording
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
