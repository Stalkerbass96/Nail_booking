"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Category = { id: string; name: string };

// Nav bar own height: py-2.5 (10px×2) + button 28px ≈ 48px
const NAV_H = 48;

export default function ServicesCategoryNav({ categories }: { categories: Category[] }) {
  // Measured at runtime so it works on both mobile (52+1=53px) and desktop (56+1=57px)
  const [headerH, setHeaderH] = useState(57);
  const [activeId, setActiveId] = useState(categories[0]?.id ?? "");
  const navRef = useRef<HTMLDivElement>(null);

  // Measure site-header height (including its border-bottom) and re-measure on resize
  useLayoutEffect(() => {
    const measure = () => {
      const el = document.querySelector(".site-header");
      if (el) setHeaderH(el.getBoundingClientRect().height);
    };
    measure();
    window.addEventListener("resize", measure, { passive: true });
    return () => window.removeEventListener("resize", measure);
  }, []);

  const scrollOffset = headerH + NAV_H + 8;

  // Track which section is in the viewport
  useEffect(() => {
    if (categories.length <= 1) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const hits = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (hits.length > 0) {
          setActiveId(hits[0].target.id.replace("cat-", ""));
        }
      },
      { rootMargin: `-${scrollOffset}px 0px -55% 0px`, threshold: 0 }
    );

    for (const cat of categories) {
      const el = document.getElementById(`cat-${cat.id}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [categories, scrollOffset]);

  // Keep the active pill scrolled into view inside the nav
  useEffect(() => {
    const btn = navRef.current?.querySelector<HTMLElement>(`[data-cat="${activeId}"]`);
    btn?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [activeId]);

  if (categories.length <= 1) return null;

  function handleClick(id: string) {
    setActiveId(id);
    const el = document.getElementById(`cat-${id}`);
    if (!el) return;
    // Manual offset scroll so both sticky bars are accounted for
    const top = el.getBoundingClientRect().top + window.scrollY - scrollOffset;
    window.scrollTo({ top, behavior: "smooth" });
  }

  return (
    // No negative margins — avoids horizontal page overflow on mobile.
    // The sticky top is measured dynamically to sit flush below the site header.
    <div
      className="sticky z-10"
      style={{
        top: headerH,
        // Overlap the header's bottom border by 1px so there's no gap/line
        marginTop: -1,
        borderBottom: "1px solid var(--border)",
        background: "rgba(250, 248, 245, 0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)"
      }}
    >
      <div
        ref={navRef}
        className="flex gap-1.5 overflow-x-auto py-2.5"
        style={{ scrollbarWidth: "none" }}
      >
        {categories.map((cat) => {
          const active = activeId === cat.id;
          return (
            <button
              key={cat.id}
              data-cat={cat.id}
              onClick={() => handleClick(cat.id)}
              type="button"
              className="shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-150"
              style={
                active
                  ? { background: "var(--text)", color: "#fff" }
                  : {
                      background: "var(--surface)",
                      color: "var(--text-2)",
                      border: "1px solid var(--border-mid)"
                    }
              }
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
