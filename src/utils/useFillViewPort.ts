import { useLayoutEffect, useState, type RefObject } from "react";

// Where the element sits from the very top of the page, even if the page
// (or a parent) is already scrolled
const documentTop = (el: HTMLElement) => {
  let top = el.getBoundingClientRect().top;
  for (let node = el.parentElement; node; node = node.parentElement) {
    top += node.scrollTop;
  }
  return top;
};

/**
 * Returns the height that makes `ref` fill the window from where it starts
 * (just under your header) down to the bottom edge. Use it for full-screen
 * screens like the POS, where `h-screen` is too tall because of the header.
 *
 *   const rootRef = useRef<HTMLDivElement>(null);
 *   const height = useFillViewport(rootRef);
 *   <div ref={rootRef} style={{ height: height ?? "100vh" }} className="overflow-hidden">
 */
export const useFillViewport = (
  ref: RefObject<HTMLElement | null>,
  minHeight = 480,
) => {
  const [height, setHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const fit = () => {
      const el = ref.current;
      if (!el) return;
      setHeight(Math.max(window.innerHeight - documentTop(el), minHeight));
    };

    fit();
    const settle = setTimeout(fit, 150); // once more after the layout settles
    window.addEventListener("resize", fit);

    return () => {
      clearTimeout(settle);
      window.removeEventListener("resize", fit);
    };
  }, [ref, minHeight]);

  return height;
};