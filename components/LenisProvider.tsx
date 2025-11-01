"use client";

import { ReactNode, useEffect, useState } from "react";
import Lenis from "@studio-freight/lenis";

export default function LenisProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // ✅ Wait a tick to ensure hydration is complete
    const timer = setTimeout(() => {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

      const raf = (time: number) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };

      requestAnimationFrame(raf);
      setIsReady(true);

      return () => {
        lenis.destroy();
        clearTimeout(timer);
      };
    }, 100); // <-- short delay to ensure hydration complete
  }, []);

  // Don’t render children until ready to prevent mismatch
  if (!isReady) return null;

  return <>{children}</>;
}
