"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Owns every scroll-driven animation on the page.
 *
 * Elements opt in declaratively:
 *   data-reveal="up | fade | scale | left | right | rise3d"
 *   data-reveal-delay="0.15"
 *   data-stagger            -> animates direct children instead of the element
 *   data-parallax="-12"     -> yPercent drift, decorative layers only
 *   data-pin                -> pins the section and scrubs its children
 *
 * Reduced motion is handled by gsap.matchMedia: the reduce branch renders the
 * final state immediately and registers no ScrollTriggers at all.
 */
export default function MotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    // Signals CSS that JS owns the reveal states. Without this class the
    // content stays visible, so a JS failure never blanks the page.
    document.documentElement.classList.add("js-ready");

    const mm = gsap.matchMedia();

    mm.add(
      {
        motionOK: "(prefers-reduced-motion: no-preference)",
        reduced: "(prefers-reduced-motion: reduce)",
        isDesktop: "(min-width: 1024px)",
      },
      (ctx) => {
        const { reduced, isDesktop } = ctx.conditions as {
          motionOK: boolean;
          reduced: boolean;
          isDesktop: boolean;
        };

        // On desktop the pinned timeline owns its own steps, so they must not
        // also pick up a generic reveal trigger (the two would fight).
        const reveals = gsap.utils
          .toArray<HTMLElement>("[data-reveal]")
          .filter((el) => !(isDesktop && el.hasAttribute("data-pin-step")));

        if (reduced) {
          // Final state, immediately. No triggers, no scrubbing.
          gsap.set(reveals, { opacity: 1, clearProps: "transform" });
          gsap.utils
            .toArray<HTMLElement>("[data-stagger] > *")
            .forEach((el) => gsap.set(el, { opacity: 1, clearProps: "transform" }));
          return;
        }

        /* ---- Reveals -------------------------------------------------- */
        const tweens: gsap.core.Tween[] = [];

        reveals.forEach((el) => {
          const kind = el.dataset.reveal || "up";
          const delay = parseFloat(el.dataset.revealDelay || "0");
          const isStagger = el.hasAttribute("data-stagger");
          const targets = isStagger
            ? (Array.from(el.children) as HTMLElement[])
            : [el];

          if (isStagger) gsap.set(el, { opacity: 1 });

          const from: gsap.TweenVars = { opacity: 0 };
          const to: gsap.TweenVars = { opacity: 1 };

          switch (kind) {
            case "fade":
              break;
            case "scale":
              from.scale = 0.94;
              to.scale = 1;
              break;
            case "left":
              from.x = -36;
              to.x = 0;
              break;
            case "right":
              from.x = 36;
              to.x = 0;
              break;
            case "rise3d":
              // Depth entrance: comes toward the viewer while rotating flat.
              from.y = 64;
              from.rotateX = -22;
              from.z = -160;
              from.transformPerspective = 1000;
              from.transformOrigin = "50% 100%";
              to.y = 0;
              to.rotateX = 0;
              to.z = 0;
              break;
            default:
              from.y = 28;
              to.y = 0;
          }

          /* fromTo, not from: the CSS pre-hide sets opacity to 0, and gsap.from
             would read that as the *destination* and animate 0 -> 0. */
          const tween = gsap.fromTo(targets, from, {
            ...to,
            duration: kind === "rise3d" ? 0.9 : 0.65,
            delay,
            ease: "expo.out",
            stagger: isStagger ? 0.06 : 0,
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
            onComplete: () => {
              // Free the compositor layer once the element has settled.
              gsap.set(targets, { willChange: "auto" });
            },
          });

          tweens.push(tween);
        });

        /* ---- Decorative parallax layers ------------------------------- */
        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
          const amount = parseFloat(el.dataset.parallax || "-10");
          gsap.to(el, {
            yPercent: amount,
            ease: "none",
            scrollTrigger: {
              trigger: el.parentElement || el,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6,
            },
          });
        });

        /* ---- Pinned scrub sections ------------------------------------
           Desktop only. Below lg the steps are laid out as ordinary stacked
           content, where pinning would trap the user in a very tall section
           and fight native scroll on mid-tier phones.                      */
        if (isDesktop) {
          gsap.utils.toArray<HTMLElement>("[data-pin]").forEach((section) => {
            const steps = gsap.utils.toArray<HTMLElement>(
              "[data-pin-step]",
              section,
            );
            if (!steps.length) return;

            gsap.set(steps, { opacity: 0 });

            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: section,
                start: "top top",
                end: () => `+=${steps.length * 70}%`,
                scrub: 1,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
              },
            });

            steps.forEach((step, i) => {
              const at = i * 1.2;
              tl.fromTo(
                step,
                { opacity: 0, y: 54, rotateX: -16, transformPerspective: 900 },
                { opacity: 1, y: 0, rotateX: 0, duration: 0.9, ease: "power2.out" },
                at,
              );
              // Every step but the last hands off to the next.
              if (i < steps.length - 1) {
                tl.to(
                  step,
                  { opacity: 0, y: -48, duration: 0.7, ease: "power2.in" },
                  at + 1.0,
                );
              }
            });
          });
        }

        /* ---- Failsafe --------------------------------------------------
           requestAnimationFrame is suspended in a background tab, so a page
           opened in one would sit on its pre-hide state and render blank
           until the tab is focused. Timers still fire there, so this snaps
           any reveal that has not started to its final frame. Content must
           never depend on an animation having run.                        */
        const failsafe = window.setTimeout(() => {
          tweens.forEach((t) => {
            const el = (t.targets()[0] as HTMLElement) ?? null;
            if (!el) return;
            const box = el.getBoundingClientRect();
            const inView = box.top < window.innerHeight && box.bottom > 0;
            if (inView && t.progress() === 0) t.progress(1);
          });
        }, 2600);

        return () => {
          window.clearTimeout(failsafe);
          gsap.set(reveals, { clearProps: "all" });
        };
      },
    );

    // Fonts and images change layout height; recompute once they land.
    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts?.ready) document.fonts.ready.then(refresh);
    window.addEventListener("load", refresh);

    return () => {
      window.removeEventListener("load", refresh);
      mm.revert();
    };
  }, [pathname]);

  return <>{children}</>;
}
