import React from 'react';
import {render, fireEvent} from '@testing-library/react';
import {EmptyState} from './EmptyState';

test('shows a search-aware message when there are no matches', () => {
    const {getByText} = render(<EmptyState search="rust" isError={false} onClearSearch={() => {}}/>);
    expect(getByText(/rust/i)).toBeInTheDocument();
});

test('shows a generic message when there is no active search', () => {
    const {getByText} = render(<EmptyState search="" isError={false} onClearSearch={() => {}}/>);
    expect(getByText(/no programmers found/i)).toBeInTheDocument();
});

test('shows an error message when the API could not be reached', () => {
    const {getByRole} = render(<EmptyState search="" isError onClearSearch={() => {}}/>);
    expect(getByRole('alert')).toBeInTheDocument();
});

test('clear search button resets the search term', () => {
    const onClearSearch = jest.fn();
    const {getByText} = render(<EmptyState search="rust" isError={false} onClearSearch={onClearSearch}/>);
    fireEvent.click(getByText(/clear search/i));
    expect(onClearSearch).toHaveBeenCalledWith("");
});
