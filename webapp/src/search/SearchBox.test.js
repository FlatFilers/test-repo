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
