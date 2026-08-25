import React from 'react';
import {render, fireEvent} from '@testing-library/react';
import {SearchBox} from './SearchBox';

test('typing calls updateSearch with the new value', () => {
    const updateSearch = jest.fn();
    const {getByPlaceholderText} = render(<SearchBox search="" updateSearch={updateSearch}/>);
    fireEvent.change(getByPlaceholderText(/type a skill/i), {target: {value: "go"}});
    expect(updateSearch).toHaveBeenCalledWith("go");
});

test('clear button only appears once there is a search term', () => {
    const {queryByLabelText, rerender} = render(<SearchBox search="" updateSearch={() => {}}/>);
    expect(queryByLabelText(/clear search/i)).not.toBeInTheDocument();

    rerender(<SearchBox search="go" updateSearch={() => {}}/>);
    expect(queryByLabelText(/clear search/i)).toBeInTheDocument();
});

test('clear button resets the search', () => {
    const updateSearch = jest.fn();
    const {getByLabelText} = render(<SearchBox search="go" updateSearch={updateSearch}/>);
    fireEvent.click(getByLabelText(/clear search/i));
    expect(updateSearch).toHaveBeenCalledWith("");
});
