import React from 'react';
import {render, fireEvent} from '@testing-library/react';
import {act} from 'react-dom/test-utils';
import {BarrelRoll} from './BarrelRoll';

const FULL_SEQUENCE = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a'
];

// Spin (1.2s) plus the longest possible confetti stagger (0.4s) — see
// CLEANUP_DELAY_MS in BarrelRoll.js. Cleanup must not fire any earlier, or
// late confetti pieces get removed mid-fall.
const CLEANUP_DELAY_MS = 1600;

function fireKonamiCode() {
    FULL_SEQUENCE.forEach(key => fireEvent.keyDown(window, {key}));
}

beforeEach(() => {
    jest.useFakeTimers();
});

afterEach(() => {
    jest.useRealTimers();
});

test('renders its children', () => {
    const {getByText} = render(<BarrelRoll><p>hello</p></BarrelRoll>);
    expect(getByText('hello')).toBeInTheDocument();
});

test('the Konami code shows the badge and spins the stage, then auto-cleans up', () => {
    const {getByText, queryByText, container} = render(<BarrelRoll><p>hello</p></BarrelRoll>);

    fireKonamiCode();

    expect(getByText('1337 MODE')).toBeInTheDocument();
    expect(container.querySelector('.barrel-roll__stage').classList.contains('barrel-roll__stage--spinning')).toBe(true);

    act(() => {
        jest.advanceTimersByTime(CLEANUP_DELAY_MS);
    });

    expect(queryByText('1337 MODE')).not.toBeInTheDocument();
    expect(container.querySelector('.barrel-roll__stage').classList.contains('barrel-roll__stage--spinning')).toBe(false);
});

test('keeps the badge and confetti outside the spinning stage so they stay fixed to the viewport', () => {
    const {container} = render(<BarrelRoll><p>hello</p></BarrelRoll>);

    fireKonamiCode();

    const stage = container.querySelector('.barrel-roll__stage');
    const badge = container.querySelector('.barrel-roll__badge');
    const confetti = container.querySelector('.barrel-roll__confetti');

    // A `transform` on an ancestor turns `position: fixed` descendants into
    // ancestor-relative ones, so the badge/confetti must not be inside the
    // element that carries the spin animation.
    expect(stage.contains(badge)).toBe(false);
    expect(stage.contains(confetti)).toBe(false);

    // Flush the pending cleanup timeout so it doesn't fire against an
    // unmounted tree once RTL's auto-cleanup runs after this test.
    act(() => {
        jest.advanceTimersByTime(CLEANUP_DELAY_MS);
    });
});

test('can be re-triggered after cleaning up', () => {
    const {getByText, queryByText} = render(<BarrelRoll><p>hello</p></BarrelRoll>);

    fireKonamiCode();
    expect(getByText('1337 MODE')).toBeInTheDocument();

    act(() => {
        jest.advanceTimersByTime(CLEANUP_DELAY_MS);
    });
    expect(queryByText('1337 MODE')).not.toBeInTheDocument();

    fireKonamiCode();
    expect(getByText('1337 MODE')).toBeInTheDocument();
});

test('removes the window keydown listener on unmount', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');
    const removeSpy = jest.spyOn(window, 'removeEventListener');

    const {unmount} = render(<BarrelRoll><p>hello</p></BarrelRoll>);
    const [, handler] = addSpy.mock.calls.find(([type]) => type === 'keydown');

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('keydown', handler);

    addSpy.mockRestore();
    removeSpy.mockRestore();
});

test('clears the pending cleanup timeout on unmount', () => {
    const clearSpy = jest.spyOn(window, 'clearTimeout');

    const {unmount} = render(<BarrelRoll><p>hello</p></BarrelRoll>);
    fireKonamiCode();

    unmount();

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
});
