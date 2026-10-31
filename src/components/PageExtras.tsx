"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { StoryPager } from "./consulting/core";

// Storyline pager on the five story pages, plus a back-to-top button once the reader is deep in a page.
export default function PageExtras() {
  const path = usePathname();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 900);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <>
      <StoryPager path={path} />
      {show && (
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top"
          className="btn btn-secondary fixed bottom-5 right-5 z-20 h-10 w-10 px-0 rounded-full shadow-md print:hidden">
          <ArrowUp aria-hidden size={17} />
        </button>
      )}
    </>
  );
}
