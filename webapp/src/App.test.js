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

test('shows a live result count that matches the rendered rows and names the active filter', async () => {
    const client = mockClient();
    client.query
        .mockReturnValueOnce(Promise.resolve({data: {programmers: []}})) // componentDidMount
        .mockReturnValueOnce(Promise.resolve({
            data: {
                programmers: [
                    {name: 'Gopher One', title: 't', picture: '', company: 'c', skills: []},
                    {name: 'Gopher Two', title: 't', picture: '', company: 'c', skills: []},
                    {name: 'Gopher Three', title: 't', picture: '', company: 'c', skills: []}
                ]
            }
        }));

    const {getByPlaceholderText, getByText, container} = render(<App client={client}/>);
    await flush();

    fireEvent.change(getByPlaceholderText(/Type skill name/i), {target: {value: 'go'}});
    await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
    });

    expect(container.querySelectorAll('.collection-item')).toHaveLength(3);
    expect(getByText('3 programmers with go')).toBeInTheDocument();
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
