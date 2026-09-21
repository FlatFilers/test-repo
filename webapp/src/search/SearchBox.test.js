import React from 'react';
import {render, fireEvent} from '@testing-library/react';
import {SearchBox} from './SearchBox';

test('does not render a clear control when the search is empty', () => {
    const updateSearch = jest.fn();
    const {queryByLabelText} = render(
        <SearchBox search="" updateSearch={updateSearch} count={0} loading={false} initialLoadComplete={true}/>
    );

    expect(queryByLabelText('Clear search')).not.toBeInTheDocument();
});

test('renders a clear control that resets the search when the search is non-empty', () => {
    const updateSearch = jest.fn();
    const {getByLabelText} = render(
        <SearchBox search="go" updateSearch={updateSearch} count={3} loading={false} initialLoadComplete={true}/>
    );

    fireEvent.click(getByLabelText('Clear search'));

    expect(updateSearch).toHaveBeenCalledWith("");
});

test('shows a plain count with correct singular/plural when no filter is active', () => {
    const {getByText, queryByText} = render(
        <SearchBox search="" updateSearch={jest.fn()} count={1} loading={false} initialLoadComplete={true}/>
    );

    expect(getByText('1 programmer')).toBeInTheDocument();
    expect(queryByText(/with/)).not.toBeInTheDocument();
});

test('names the active filter in the count once results have loaded', () => {
    const {getByText} = render(
        <SearchBox search="go" updateSearch={jest.fn()} count={3} loading={false} initialLoadComplete={true}/>
    );

    expect(getByText('3 programmers with go')).toBeInTheDocument();
});

test('hides the count until the initial load has resolved', () => {
    const {queryByText} = render(
        <SearchBox search="" updateSearch={jest.fn()} count={0} loading={true} initialLoadComplete={false}/>
    );

    expect(queryByText(/programmer/)).not.toBeInTheDocument();
});

test('does not render a listbox when suggestionsOpen is false, even with suggestions present', () => {
    const {queryByRole} = render(
        <SearchBox search="c" updateSearch={jest.fn()} count={0} loading={false} initialLoadComplete={true}
                   suggestions={["C#", "C++"]} suggestionsOpen={false} activeSuggestion={-1}
                   onSelectSuggestion={jest.fn()}/>
    );

    expect(queryByRole('listbox')).not.toBeInTheDocument();
});

test('renders the listbox with suggestions when suggestionsOpen is true', () => {
    const {getByRole, getAllByRole} = render(
        <SearchBox search="c" updateSearch={jest.fn()} count={0} loading={false} initialLoadComplete={true}
                   suggestions={["C#", "C++"]} suggestionsOpen={true} activeSuggestion={-1}
                   onSelectSuggestion={jest.fn()}/>
    );

    expect(getByRole('listbox')).toBeInTheDocument();
    expect(getAllByRole('option')).toHaveLength(2);
});

test('clicking a suggestion calls onSelectSuggestion with the skill name', () => {
    const onSelectSuggestion = jest.fn();
    const {getAllByRole} = render(
        <SearchBox search="c" updateSearch={jest.fn()} count={0} loading={false} initialLoadComplete={true}
                   suggestions={["C#", "C++"]} suggestionsOpen={true} activeSuggestion={-1}
                   onSelectSuggestion={onSelectSuggestion}/>
    );

    fireEvent.mouseDown(getAllByRole('option')[1]);

    expect(onSelectSuggestion).toHaveBeenCalledWith("C++");
});

test('forwards keyDown and blur events to the handlers passed by App', () => {
    const onSearchKeyDown = jest.fn();
    const onSearchBlur = jest.fn();
    const {getByPlaceholderText} = render(
        <SearchBox search="" updateSearch={jest.fn()} count={0} loading={false} initialLoadComplete={true}
                   onSearchKeyDown={onSearchKeyDown} onSearchBlur={onSearchBlur}/>
    );

    const input = getByPlaceholderText(/Type skill name/i);
    fireEvent.keyDown(input, {key: 'ArrowDown'});
    fireEvent.blur(input);

    expect(onSearchKeyDown).toHaveBeenCalled();
    expect(onSearchBlur).toHaveBeenCalled();
});

test('exposes combobox ARIA attributes reflecting open state and active suggestion', () => {
    const {getByPlaceholderText, rerender} = render(
        <SearchBox search="c" updateSearch={jest.fn()} count={0} loading={false} initialLoadComplete={true}
                   suggestions={["C#", "C++"]} suggestionsOpen={false} activeSuggestion={-1}/>
    );

    const input = getByPlaceholderText(/Type skill name/i);
    expect(input).toHaveAttribute('role', 'combobox');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveAttribute('aria-controls', 'skill-suggestions');
    expect(input).not.toHaveAttribute('aria-activedescendant');

    rerender(
        <SearchBox search="c" updateSearch={jest.fn()} count={0} loading={false} initialLoadComplete={true}
                   suggestions={["C#", "C++"]} suggestionsOpen={true} activeSuggestion={1}/>
    );

    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', 'skill-suggestion-1');
});
