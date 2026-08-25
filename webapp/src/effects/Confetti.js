import React, {useMemo} from "react";
import "./Confetti.css";

const COLORS = ["#f472b6", "#a78bfa", "#60a5fa", "#34d399", "#fbbf24", "#fb7185"];
const PIECE_COUNT = 60;

function randomPiece(index) {
    return {
        id: index,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 2.4 + Math.random() * 1.6,
        rotation: Math.random() * 360,
        color: COLORS[index % COLORS.length]
    };
}

/**
 * A short-lived, non-blocking confetti burst used as the Konami-code
 * easter egg reward. Purely decorative: `usePrefersReducedMotion`
 * callers should avoid rendering this at all, and it never intercepts
 * clicks (pointer-events: none).
 */
export function Confetti() {
    const pieces = useMemo(
        () => Array.from({length: PIECE_COUNT}, (_, i) => randomPiece(i)),
        []
    );

    return <div className="confetti" aria-hidden="true">
        {pieces.map(piece => <span
            key={piece.id}
            className="confetti-piece"
            style={{
                left: `${piece.left}%`,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
                backgroundColor: piece.color,
                transform: `rotate(${piece.rotation}deg)`
            }}
        />)}
    </div>;
}
