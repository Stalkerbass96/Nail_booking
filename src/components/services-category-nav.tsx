"use client";

import { useEffect, useRef, useState } from "react";

type Category = { id: string; name: string };

// Site header height (defined in globals.css .site-header-inner → height: 56px)
const HEADER_H = 56;
// Height of this nav bar itself (py-2.5 × 2 + button ~28px ≈ 48px)
const NAV_H = 48;
const SCROLL_OFFSET = HEADER_H + NAV_H + 8; // a little extra breathing room

export default function ServicesCategoryNav({ categories }: { categories: Category[] }) {
  const [activeId, setActiveId] = useState(categories[0]?.id ?? "");
  const navRef = useRef<HTMLDivElement>(null);

  // --- Intersection observer: track which section is in view ---
  useEffect(() => {
    if (categories.length <= 1) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the topmost intersecting section
        const hits = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (hits.length > 0) {
          setActiveId(hits[0].target.id.replace("cat-", ""));
        }
      },
      { rootMargin: `-${SCROLL_OFFSET}px 0px -55% 0px`, threshold: 0 }
    );

    for (const cat of categories) {
      const el = document.getElementById(`cat-${cat.id}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [categories]);

  // --- Keep the active pill scrolled into view in the nav ---
  useEffect(() => {
    const btn = navRef.current?.querySelector<HTMLElement>(`[data-cat="${activeId}"]`);
    btn?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [activeId]);

  if (categories.length <= 1) return null;

  function handleClick(id: string) {
    setActiveId(id);
    const el = document.getElementById(`cat-${id}`);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top, behavior: "smooth" });
  }

  return (
    <div
      ref={navRef}
      className="sticky z-10 -mx-4 overflow-x-auto sm:-mx-6"
      style={{
        top: HEADER_H,
        borderBottom: "1px solid var(--border)",
        background: "rgba(250, 248, 245, 0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        scrollbarWidth: "none"
      }}
    >
      <div className="flex gap-1.5 px-4 py-2.5 sm:px-6">
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
