import React from 'react';
import {render, fireEvent} from '@testing-library/react';
import {Skill} from './Skill';

test('renders a skill with low importance in the base tier', () => {
    const skill = {
        name: "Java",
        importance: 1
    };
    const {getByText, getByRole} = render(<Skill skill={skill} updateSearch={() => {}}/>);
    const element = getByText(/Java/i);
    expect(element).toBeInTheDocument();
    expect(getByRole('button').classList.contains('skill-chip--tier-1')).toBe(true)
});

test('renders a skill with high importance in a higher tier', () => {
    const skill = {
        name: "Java",
        importance: 2
    };
    const {getByText, getByRole} = render(<Skill skill={skill} updateSearch={() => {}}/>);
    const skillName = getByText(/Java/i);
    expect(skillName).toBeInTheDocument();
    expect(getByRole('button').classList.contains('skill-chip--tier-2')).toBe(true)
});

test('clicking a skill triggers the search callback with its name', () => {
    const skill = {name: "Go", importance: 1};
    const updateSearch = jest.fn();
    const {getByRole} = render(<Skill skill={skill} updateSearch={updateSearch}/>);
    fireEvent.click(getByRole('button'));
    expect(updateSearch).toHaveBeenCalledWith("Go");
});

test('pressing Enter on a focused skill triggers the search callback', () => {
    const skill = {name: "Go", importance: 1};
    const updateSearch = jest.fn();
    const {getByRole} = render(<Skill skill={skill} updateSearch={updateSearch}/>);
    fireEvent.keyDown(getByRole('button'), {key: 'Enter'});
    expect(updateSearch).toHaveBeenCalledWith("Go");
});

test('highlighted skills carry the highlighted modifier class', () => {
    const skill = {name: "Go", importance: 1};
    const {getByRole} = render(<Skill skill={skill} highlighted updateSearch={() => {}}/>);
    expect(getByRole('button').classList.contains('skill-chip--highlighted')).toBe(true)
});
