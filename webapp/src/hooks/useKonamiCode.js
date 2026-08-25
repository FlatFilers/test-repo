import {useEffect, useState} from "react";

const KONAMI_SEQUENCE = [
    "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
    "b", "a"
];

/**
 * Listens for the classic Konami code and calls onActivate() when the
 * full sequence is typed. Keys are matched case-insensitively for
 * letters. Cleans up its own listener on unmount.
 */
export function useKonamiCode(onActivate) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        function handleKeyDown(event) {
            const expected = KONAMI_SEQUENCE[progress];
            const pressed = event.key.length === 1 ? event.key.toLowerCase() : event.key;
            const matches = pressed === expected;

            setProgress(matches ? progress + 1 : (pressed === KONAMI_SEQUENCE[0] ? 1 : 0));

            if (matches && progress + 1 === KONAMI_SEQUENCE.length) {
                setProgress(0);
                onActivate();
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [progress, onActivate]);
}
