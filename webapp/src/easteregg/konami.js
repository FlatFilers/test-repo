// Pure, React-free Konami-code sequence matcher.
//
// Streaming key input can't just reset to index 0 on a mismatch: a prefix
// like the extra leading Up in ArrowUp,ArrowUp,ArrowUp,ArrowDown,... would
// wrongly poison the whole match (naive `index = 0` loses the two Ups that
// are still a valid start of a fresh attempt). Instead we backtrack to the
// longest previously-matched suffix that is also a valid prefix of the
// sequence, using the classic KMP failure/LPS table computed once up front.

export const KONAMI_SEQUENCE = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a'
];

function normalizeKey(key) {
    // Some synthetic and IME events fire keydown with no `key` at all;
    // treat that as unmatchable rather than throwing on key.length.
    if (typeof key !== 'string') {
        return null;
    }
    // Arrow keys are multi-character ("ArrowUp") and already consistent;
    // only single-character keys (b/a) need case folding.
    return key.length === 1 ? key.toLowerCase() : key;
}

function buildFailureTable(sequence) {
    const table = new Array(sequence.length).fill(0);
    let prefixLength = 0;
    for (let i = 1; i < sequence.length; i++) {
        while (prefixLength > 0 && sequence[i] !== sequence[prefixLength]) {
            prefixLength = table[prefixLength - 1];
        }
        if (sequence[i] === sequence[prefixLength]) {
            prefixLength++;
        }
        table[i] = prefixLength;
    }
    return table;
}

// Returns a `handleKeyDown(event)` function that tracks progress through
// `sequence` and invokes `onUnlock()` exactly once each time the full
// sequence is completed, then resets to match again.
export function createKonamiMatcher(onUnlock, sequence = KONAMI_SEQUENCE) {
    const failureTable = buildFailureTable(sequence);
    let matchedLength = 0;

    return function handleKeyDown(event) {
        const key = normalizeKey(event && event.key);
        if (key === null) {
            return;
        }

        while (matchedLength > 0 && key !== sequence[matchedLength]) {
            matchedLength = failureTable[matchedLength - 1];
        }
        if (key === sequence[matchedLength]) {
            matchedLength++;
        }
        if (matchedLength === sequence.length) {
            matchedLength = 0;
            onUnlock();
        }
    };
}
