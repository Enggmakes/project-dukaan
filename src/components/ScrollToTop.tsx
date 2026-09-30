import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Automatically scrolls window to top on route change.
 * Prevents SPA scroll-retention bug where mobile users land at the footer.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Reset scroll immediately without delay
    window.scrollTo(0, 0);
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    } catch {
      // Fallback for older WebKit browsers
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [pathname]);

  return null;
}
