import {useEffect, useState} from "react";

/**
 * Tracks the user's `prefers-reduced-motion` OS setting so components can
 * skip purely decorative motion (confetti, parallax, etc.) instead of
 * relying on CSS alone.
 */
export function usePrefersReducedMotion() {
    const query = "(prefers-reduced-motion: reduce)";
    const [reduced, setReduced] = useState(
        () => typeof window !== "undefined" && window.matchMedia
            ? window.matchMedia(query).matches
            : false
    );

    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) {
            return;
        }
        const mediaQueryList = window.matchMedia(query);
        const listener = (event) => setReduced(event.matches);
        mediaQueryList.addListener(listener);
        return () => mediaQueryList.removeListener(listener);
    }, []);

    return reduced;
}
