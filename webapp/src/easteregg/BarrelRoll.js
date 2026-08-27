import React, {useCallback, useEffect, useRef, useState} from 'react';
import {createKonamiMatcher} from './konami';
import './BarrelRoll.css';

const ANIMATION_DURATION_MS = 1200;
const CONFETTI_PIECE_COUNT = 30;
const MAX_CONFETTI_DELAY_MS = 400;
// Confetti pieces stagger their start by up to MAX_CONFETTI_DELAY_MS, then
// take ANIMATION_DURATION_MS to fall (see the CSS keyframe). Clean up only
// once the last piece has actually finished falling, or late pieces get
// yanked out of the DOM mid-air.
const CLEANUP_DELAY_MS = ANIMATION_DURATION_MS + MAX_CONFETTI_DELAY_MS;
const CONFETTI_COLORS = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];

function prefersReducedMotion() {
    // jsdom (test env) doesn't implement matchMedia; treat that as "no
    // preference" rather than throwing.
    return typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function buildConfettiPieces() {
    return Array.from({length: CONFETTI_PIECE_COUNT}, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: (Math.random() * MAX_CONFETTI_DELAY_MS) / 1000,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]
    }));
}

// Wraps `children`, listens for the Konami code anywhere in the window, and
// on unlock spins itself, drops hand-rolled confetti, and shows a
// '1337 MODE' badge — all cleaned up automatically once the animation
// finishes.
export function BarrelRoll(props) {
    const [active, setActive] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    const [confetti, setConfetti] = useState([]);
    const timeoutRef = useRef(null);

    const trigger = useCallback(() => {
        const reduceMotion = prefersReducedMotion();
        setReducedMotion(reduceMotion);
        setActive(true);
        setConfetti(reduceMotion ? [] : buildConfettiPieces());

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setActive(false);
            setConfetti([]);
            timeoutRef.current = null;
        }, CLEANUP_DELAY_MS);
    }, []);

    useEffect(() => {
        const handleKeyDown = createKonamiMatcher(trigger);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [trigger]);

    const spinning = active && !reducedMotion;

    // The spinning stage is a separate element from the badge/confetti: a
    // `transform` on an ancestor makes `position: fixed` descendants anchor
    // to that ancestor instead of the viewport (CSS Transforms spec), so the
    // badge and confetti must live outside the element that spins.
    return <div className="barrel-roll">
        <div className={`barrel-roll__stage${spinning ? ' barrel-roll__stage--spinning' : ''}`}>
            {props.children}
        </div>
        {active && <div className="barrel-roll__badge" role="status">1337 MODE</div>}
        {spinning && <div className="barrel-roll__confetti" aria-hidden="true">
            {confetti.map(piece => <span
                key={piece.id}
                className="barrel-roll__confetti-piece"
                style={{
                    left: `${piece.left}%`,
                    animationDelay: `${piece.delay}s`,
                    backgroundColor: piece.color
                }}
            />)}
        </div>}
    </div>;
}
