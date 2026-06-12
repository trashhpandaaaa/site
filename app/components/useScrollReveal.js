"use client";

import { useEffect } from "react";

// Progressive reveal for .fi elements: each card animates in as it scrolls
// into view instead of all at once on load. Falls back to showing everything
// immediately when IntersectionObserver isn't available or the user prefers
// reduced motion.
export default function useScrollReveal(deps = []) {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll(".fi:not(.show)"));
    if (!elements.length) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      elements.forEach((el) => el.classList.add("show"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
