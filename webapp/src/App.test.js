import React from 'react';
import {render, fireEvent} from '@testing-library/react';
import {act} from 'react-dom/test-utils';
import {App} from './App';

// Creates a mock Apollo client compatible with `client.query(...)`, so tests
// never touch the network.
function mockClient(queryImpl) {
    return {query: jest.fn(queryImpl || (() => Promise.resolve({data: {programmers: []}})))};
}

function deferred() {
    let resolve;
    const promise = new Promise(res => {
        resolve = res;
    });
    return {promise, resolve};
}

const flush = () => act(() => Promise.resolve());

beforeEach(() => {
    jest.useFakeTimers();
});

afterEach(() => {
    jest.useRealTimers();
});

test('renders sanity check', async () => {
    const client = mockClient();
    const {container} = render(<App client={client}/>);
    await flush();
    expect(container).toBeInTheDocument();
});

test('sends the search term as a GraphQL variable instead of interpolating it', async () => {
    const client = mockClient();
    const {getByPlaceholderText} = render(<App client={client}/>);
    await flush();

    const maliciousInput = '"}) { programmers(skill: "x';
    fireEvent.change(getByPlaceholderText(/Type skill name/i), {target: {value: maliciousInput}});

    await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
    });

    const lastCall = client.query.mock.calls[client.query.mock.calls.length - 1][0];
    expect(lastCall.variables).toEqual({skill: maliciousInput});
    // The query document itself must never contain the raw user input.
    expect(lastCall.query.loc.source.body).not.toContain(maliciousInput);
    expect(lastCall.query.loc.source.body).toContain('$skill');
});

test('debounces a burst of typing into a single request', async () => {
    const client = mockClient();
    const {getByPlaceholderText} = render(<App client={client}/>);
    await flush();
    client.query.mockClear(); // drop the componentDidMount call

    const input = getByPlaceholderText(/Type skill name/i);
    fireEvent.change(input, {target: {value: 'j'}});
    fireEvent.change(input, {target: {value: 'ja'}});
    fireEvent.change(input, {target: {value: 'jav'}});
    fireEvent.change(input, {target: {value: 'java'}});

    // Still within the debounce window: no request yet, but the input value
    // is already updated (controlled + responsive).
    expect(client.query).not.toHaveBeenCalled();
    expect(input.value).toBe('java');

    await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
    });

    expect(client.query).toHaveBeenCalledTimes(1);
    expect(client.query.mock.calls[0][0].variables).toEqual({skill: 'java'});
});

test('ignores a stale response so an older request cannot overwrite newer results', async () => {
    const rubyResponse = deferred();
    const goResponse = deferred();
    const client = mockClient();
    client.query
        .mockReturnValueOnce(Promise.resolve({data: {programmers: []}})) // componentDidMount
        .mockReturnValueOnce(rubyResponse.promise)
        .mockReturnValueOnce(goResponse.promise);

    const {getByPlaceholderText, queryByText} = render(<App client={client}/>);
    await flush();

    const input = getByPlaceholderText(/Type skill name/i);

    fireEvent.change(input, {target: {value: 'ruby'}});
    await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
    });

    fireEvent.change(input, {target: {value: 'go'}});
    await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
    });

    // The newer ("go") request resolves first...
    await act(async () => {
        goResponse.resolve({
            data: {programmers: [{name: 'Gopher', title: 't', picture: '', company: 'c', skills: []}]}
        });
        await Promise.resolve();
    });

    // ...then the stale ("ruby") request resolves late and must be ignored.
    await act(async () => {
        rubyResponse.resolve({
            data: {programmers: [{name: 'Rubyist', title: 't', picture: '', company: 'c', skills: []}]}
        });
        await Promise.resolve();
    });

    expect(queryByText('Gopher')).toBeInTheDocument();
    expect(queryByText('Rubyist')).not.toBeInTheDocument();
});

test('shows a loading indicator in flight and suppresses the empty state until it resolves', async () => {
    const pending = deferred();
    const client = mockClient();
    client.query
        .mockReturnValueOnce(Promise.resolve({data: {programmers: []}})) // componentDidMount
        .mockReturnValueOnce(pending.promise);

    const {getByPlaceholderText, queryByText, getByRole} = render(<App client={client}/>);
    await flush();

    fireEvent.change(getByPlaceholderText(/Type skill name/i), {target: {value: 'rust'}});
    await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
    });

    expect(getByRole('status')).toBeInTheDocument();
    expect(queryByText(/No programmers match/)).not.toBeInTheDocument();

    await act(async () => {
        pending.resolve({data: {programmers: []}});
        await Promise.resolve();
    });

    expect(queryByText(/No programmers match/)).toBeInTheDocument();
});

function programmer(name, skillCount) {
    return {
        name,
        title: 't',
        picture: '',
        company: 'c',
        skills: Array.from({length: skillCount}, (_, i) => ({name: `s${i}`, icon: '', importance: 1}))
    };
}

const renderedNames = container =>
    Array.from(container.querySelectorAll('.name')).map(el => el.textContent);

test('reorders the rendered results when a sort option is picked', async () => {
    const client = mockClient(() => Promise.resolve({
        data: {programmers: [programmer('Charlie', 3), programmer('Alice', 1), programmer('Bob', 3)]}
    }));

    const {container} = render(<App client={client}/>);
    await flush();

    // Default is the backend (best match) order.
    expect(renderedNames(container)).toEqual(['Charlie', 'Alice', 'Bob']);

    const sort = container.querySelector('#sort_order');
    act(() => {
        fireEvent.change(sort, {target: {value: 'name'}});
    });
    expect(renderedNames(container)).toEqual(['Alice', 'Bob', 'Charlie']);

    act(() => {
        fireEvent.change(sort, {target: {value: 'skills'}});
    });
    expect(renderedNames(container)).toEqual(['Bob', 'Charlie', 'Alice']);

    // Sorting is display-only: it must not re-query the backend.
    expect(client.query).toHaveBeenCalledTimes(1);
});

test('hides the sort control when there is nothing to sort', async () => {
    const client = mockClient(() => Promise.resolve({
        data: {programmers: [programmer('Alice', 1)]}
    }));

    const {container} = render(<App client={client}/>);
    await flush();

    expect(container.querySelector('#sort_order')).toBeNull();
});

test('stops loading and does not crash when the query rejects', async () => {
    const client = mockClient();
    client.query
        .mockImplementationOnce(() => Promise.resolve({data: {programmers: []}})) // componentDidMount
        .mockImplementationOnce(() => Promise.reject(new Error('network error')));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const {getByPlaceholderText, queryByRole} = render(<App client={client}/>);
    await flush();

    fireEvent.change(getByPlaceholderText(/Type skill name/i), {target: {value: 'rust'}});
    await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
    });

    expect(queryByRole('status')).not.toBeInTheDocument();

    console.error.mockRestore();
});
