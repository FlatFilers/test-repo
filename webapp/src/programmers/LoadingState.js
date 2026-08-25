import React from "react";

/**
 * Friendly loading indicator shown while the programmer search is in
 * flight. Three bouncing dots animate via CSS (see Progremmer.css);
 * `prefers-reduced-motion` freezes them to a static row.
 */
export function LoadingState() {
    return <div className="state-panel loading-state" role="status" aria-live="polite">
        <div className="loading-dots">
            <span/><span/><span/>
        </div>
        <p>Summoning talented programmers&hellip;</p>
    </div>;
}
