import React from 'react';
import {render, fireEvent} from '@testing-library/react';
import {act} from 'react-dom/test-utils';
import {BarrelRoll} from './BarrelRoll';

const FULL_SEQUENCE = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a'
];

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

test('the Konami code shows the badge and spins the grid, then auto-cleans up', () => {
    const {getByText, queryByText, container} = render(<BarrelRoll><p>hello</p></BarrelRoll>);

    fireKonamiCode();

    expect(getByText('1337 MODE')).toBeInTheDocument();
    expect(container.firstChild.classList.contains('barrel-roll--spinning')).toBe(true);

    act(() => {
        jest.advanceTimersByTime(1200);
    });

    expect(queryByText('1337 MODE')).not.toBeInTheDocument();
    expect(container.firstChild.classList.contains('barrel-roll--spinning')).toBe(false);
});

test('can be re-triggered after cleaning up', () => {
    const {getByText, queryByText} = render(<BarrelRoll><p>hello</p></BarrelRoll>);

    fireKonamiCode();
    expect(getByText('1337 MODE')).toBeInTheDocument();

    act(() => {
        jest.advanceTimersByTime(1200);
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
