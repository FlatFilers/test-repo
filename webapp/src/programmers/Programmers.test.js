import React from 'react';
import {render, fireEvent} from '@testing-library/react';
import {Programmers} from './Programmers';

function fixtureProgrammer(name) {
    return {name, title: 'Engineer', picture: '', company: 'Acme', skills: []};
}

test('renders one row per programmer for a multi-item fixture', () => {
    const fixture = [fixtureProgrammer('Ada'), fixtureProgrammer('Grace'), fixtureProgrammer('Linus')];
    const {container} = render(
        <Programmers programmers={fixture} search="" updateSearch={jest.fn()} loading={false}/>
    );

    expect(container.querySelectorAll('.collection-item')).toHaveLength(fixture.length);
});

test('renders a friendly empty state with a working clear action when a search has no matches', () => {
    const updateSearch = jest.fn();
    const {getByText} = render(
        <Programmers programmers={[]} search="cobol" updateSearch={updateSearch} loading={false}/>
    );

    expect(getByText(/No programmers match "cobol"/)).toBeInTheDocument();

    fireEvent.click(getByText('Clear search'));
    expect(updateSearch).toHaveBeenCalledWith("");
});

test('does not show the empty state for the initial pre-fetch render', () => {
    const {queryByText} = render(
        <Programmers programmers={[]} search="" updateSearch={jest.fn()} loading={true}/>
    );

    expect(queryByText(/No programmers match/)).not.toBeInTheDocument();
    expect(queryByText('Clear search')).not.toBeInTheDocument();
});
