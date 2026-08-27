import {createKonamiMatcher} from './konami';

const FULL_SEQUENCE = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a'
];

function pressSequence(handler, keys) {
    keys.forEach(key => handler({key}));
}

test('unlocks after the full Konami sequence', () => {
    const onUnlock = jest.fn();
    const handler = createKonamiMatcher(onUnlock);

    pressSequence(handler, FULL_SEQUENCE);

    expect(onUnlock).toHaveBeenCalledTimes(1);
});

test('is case-insensitive for the b/a keys', () => {
    const onUnlock = jest.fn();
    const handler = createKonamiMatcher(onUnlock);

    pressSequence(handler, [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'B', 'A'
    ]);

    expect(onUnlock).toHaveBeenCalledTimes(1);
});

test('a wrong key resets progress', () => {
    const onUnlock = jest.fn();
    const handler = createKonamiMatcher(onUnlock);

    pressSequence(handler, ['ArrowUp', 'ArrowUp', 'q']);
    pressSequence(handler, ['ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']);

    expect(onUnlock).not.toHaveBeenCalled();
});

test('backtracks on a repeated prefix instead of fully resetting (the subtle case)', () => {
    const onUnlock = jest.fn();
    const handler = createKonamiMatcher(onUnlock);

    // An extra leading ArrowUp must not poison the rest of the match: the
    // trailing nine keys still form a valid sequence and must unlock.
    pressSequence(handler, [
        'ArrowUp', 'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'
    ]);

    expect(onUnlock).toHaveBeenCalledTimes(1);
});

test('ignores a keydown event with no key instead of throwing', () => {
    const onUnlock = jest.fn();
    const handler = createKonamiMatcher(onUnlock);

    expect(() => handler({})).not.toThrow();
    expect(() => handler({key: undefined})).not.toThrow();

    // A no-key event shouldn't corrupt in-progress matching either.
    pressSequence(handler, FULL_SEQUENCE);
    expect(onUnlock).toHaveBeenCalledTimes(1);
});

test('fires exactly once per completed sequence, and can be re-triggered', () => {
    const onUnlock = jest.fn();
    const handler = createKonamiMatcher(onUnlock);

    pressSequence(handler, FULL_SEQUENCE);
    expect(onUnlock).toHaveBeenCalledTimes(1);

    pressSequence(handler, FULL_SEQUENCE);
    expect(onUnlock).toHaveBeenCalledTimes(2);
});
