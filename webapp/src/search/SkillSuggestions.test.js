import React from 'react';
import {render, fireEvent} from '@testing-library/react';
import {SkillSuggestions} from './SkillSuggestions';

test('renders nothing when suggestions is empty', () => {
    const {container} = render(
        <SkillSuggestions suggestions={[]} activeIndex={-1} onSelect={jest.fn()}/>
    );

    expect(container.firstChild).toBeNull();
});

test('renders nothing when suggestions is missing', () => {
    const {container} = render(
        <SkillSuggestions activeIndex={-1} onSelect={jest.fn()}/>
    );

    expect(container.firstChild).toBeNull();
});

test('renders one option per suggestion', () => {
    const {getAllByRole} = render(
        <SkillSuggestions suggestions={["C#", "C++", "CSS"]} activeIndex={-1} onSelect={jest.fn()}/>
    );

    const options = getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(options.map(o => o.textContent)).toEqual(["C#", "C++", "CSS"]);
});

test('marks only the active index as aria-selected', () => {
    const {getAllByRole} = render(
        <SkillSuggestions suggestions={["C#", "C++", "CSS"]} activeIndex={1} onSelect={jest.fn()}/>
    );

    const options = getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    expect(options[2]).toHaveAttribute('aria-selected', 'false');
});

test('gives each item a stable id matching skill-suggestion-{index}', () => {
    const {getAllByRole} = render(
        <SkillSuggestions suggestions={["C#", "C++", "CSS"]} activeIndex={-1} onSelect={jest.fn()}/>
    );

    const options = getAllByRole('option');
    expect(options[0]).toHaveAttribute('id', 'skill-suggestion-0');
    expect(options[1]).toHaveAttribute('id', 'skill-suggestion-1');
    expect(options[2]).toHaveAttribute('id', 'skill-suggestion-2');
});

test('mouseDown on an item calls onSelect with that skill name', () => {
    const onSelect = jest.fn();
    const {getAllByRole} = render(
        <SkillSuggestions suggestions={["C#", "C++", "CSS"]} activeIndex={-1} onSelect={onSelect}/>
    );

    fireEvent.mouseDown(getAllByRole('option')[1]);

    expect(onSelect).toHaveBeenCalledWith("C++");
});

test('mouseDown calls preventDefault so the input never loses focus before selection', () => {
    const {getAllByRole} = render(
        <SkillSuggestions suggestions={["C#", "C++", "CSS"]} activeIndex={-1} onSelect={jest.fn()}/>
    );

    const event = new MouseEvent('mousedown', {bubbles: true, cancelable: true});
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

    getAllByRole('option')[0].dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
});
