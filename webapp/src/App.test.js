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

function mockClientWithVocabulary() {
    // Mount fetch returns the full seeded vocabulary; matches the assumption
    // that autocomplete is sourced from what's already loaded.
    return mockClient(() => Promise.resolve({
        data: {
            programmers: [
                {
                    name: 'Gopher', title: 't', picture: '', company: 'c',
                    skills: [{name: 'C#', icon: '', importance: 1}, {name: 'C++', icon: '', importance: 1}, {name: 'CSS', icon: '', importance: 1}]
                },
                {
                    name: 'Rubyist', title: 't', picture: '', company: 'c',
                    skills: [{name: 'Ruby', icon: '', importance: 1}]
                }
            ]
        }
    }));
}

test('locked UX: focusing the input alone does not open the suggestion list', async () => {
    const client = mockClientWithVocabulary();
    const {getByPlaceholderText, queryByRole} = render(<App client={client}/>);
    await flush();

    const input = getByPlaceholderText(/Type skill name/i);
    fireEvent.focus(input);

    expect(queryByRole('listbox')).not.toBeInTheDocument();
});

test('typing a prefix opens the suggestion list with matching skills', async () => {
    const client = mockClientWithVocabulary();
    const {getByPlaceholderText, getAllByRole} = render(<App client={client}/>);
    await flush();

    const input = getByPlaceholderText(/Type skill name/i);
    fireEvent.change(input, {target: {value: 'c'}});

    const options = getAllByRole('option');
    expect(options.map(o => o.textContent)).toEqual(['C#', 'C++', 'CSS']);

    // Let the debounced request this keystroke queued settle before the test
    // ends, so no state update lands on the component after it unmounts.
    await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
    });
});

test('clicking a suggestion sets the search and triggers exactly one query', async () => {
    const client = mockClientWithVocabulary();
    const {getByPlaceholderText, getAllByRole} = render(<App client={client}/>);
    await flush();

    const input = getByPlaceholderText(/Type skill name/i);
    fireEvent.change(input, {target: {value: 'c'}});

    client.query.mockClear();
    fireEvent.mouseDown(getAllByRole('option')[1]); // C++

    expect(input.value).toBe('C++');

    await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
    });

    expect(client.query).toHaveBeenCalledTimes(1);
    expect(client.query.mock.calls[0][0].variables).toEqual({skill: 'C++'});
});

test('arrow keys move the active suggestion and wrap at both ends', async () => {
    const client = mockClientWithVocabulary();
    const {getByPlaceholderText, getAllByRole} = render(<App client={client}/>);
    await flush();

    const input = getByPlaceholderText(/Type skill name/i);
    fireEvent.change(input, {target: {value: 'c'}});

    fireEvent.keyDown(input, {key: 'ArrowDown'});
    expect(getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(input, {key: 'ArrowUp'});
    // Wrapped from index 0 back to the last item.
    expect(getAllByRole('option')[2]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(input, {key: 'ArrowDown'});
    // Wrapped from the last item back to the first.
    expect(getAllByRole('option')[0]).toHaveAttribute('aria-selected', 'true');

    // Let the debounced request the typed 'c' queued settle before teardown.
    await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
    });
});

test('Enter with an active suggestion commits it and fires one query', async () => {
    const client = mockClientWithVocabulary();
    const {getByPlaceholderText, getAllByRole} = render(<App client={client}/>);
    await flush();

    const input = getByPlaceholderText(/Type skill name/i);
    fireEvent.change(input, {target: {value: 'c'}});
    fireEvent.keyDown(input, {key: 'ArrowDown'});
    fireEvent.keyDown(input, {key: 'ArrowDown'});
    expect(getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');

    client.query.mockClear();
    fireEvent.keyDown(input, {key: 'Enter'});

    expect(input.value).toBe('C++');

    await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
    });

    expect(client.query).toHaveBeenCalledTimes(1);
    expect(client.query.mock.calls[0][0].variables).toEqual({skill: 'C++'});
});

test('Enter with no active suggestion submits the typed text immediately', async () => {
    const client = mockClientWithVocabulary();
    const {getByPlaceholderText} = render(<App client={client}/>);
    await flush();

    const input = getByPlaceholderText(/Type skill name/i);
    fireEvent.change(input, {target: {value: 'ruby'}});

    client.query.mockClear();
    fireEvent.keyDown(input, {key: 'Enter'});

    await act(async () => {
        await Promise.resolve();
    });

    expect(client.query).toHaveBeenCalledTimes(1);
    expect(client.query.mock.calls[0][0].variables).toEqual({skill: 'ruby'});
});

test('Escape closes the suggestion list and leaves the typed text intact', async () => {
    const client = mockClientWithVocabulary();
    const {getByPlaceholderText, queryByRole} = render(<App client={client}/>);
    await flush();

    const input = getByPlaceholderText(/Type skill name/i);
    fireEvent.change(input, {target: {value: 'c'}});
    expect(queryByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(input, {key: 'Escape'});

    expect(queryByRole('listbox')).not.toBeInTheDocument();
    expect(input.value).toBe('c');

    // Let the debounced request the typed 'c' queued settle before teardown.
    await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
    });
});

test('blur closes the suggestion list', async () => {
    const client = mockClientWithVocabulary();
    const {getByPlaceholderText, queryByRole} = render(<App client={client}/>);
    await flush();

    const input = getByPlaceholderText(/Type skill name/i);
    fireEvent.change(input, {target: {value: 'c'}});
    expect(queryByRole('listbox')).toBeInTheDocument();

    fireEvent.blur(input);

    expect(queryByRole('listbox')).not.toBeInTheDocument();

    // Let the debounced request the typed 'c' queued settle before teardown.
    await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
    });
});

test('wires combobox ARIA attributes to reflect open state and active option', async () => {
    const client = mockClientWithVocabulary();
    const {getByPlaceholderText} = render(<App client={client}/>);
    await flush();

    const input = getByPlaceholderText(/Type skill name/i);
    expect(input).toHaveAttribute('role', 'combobox');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).toHaveAttribute('aria-controls', 'skill-suggestions');
    expect(input).not.toHaveAttribute('aria-activedescendant');

    fireEvent.change(input, {target: {value: 'c'}});
    expect(input).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(input, {key: 'ArrowDown'});
    expect(input).toHaveAttribute('aria-activedescendant', 'skill-suggestion-0');

    // Let the debounced request the typed 'c' queued settle before teardown.
    await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
    });
});

test('vocabulary never shrinks after a narrowed search returns fewer skills', async () => {
    const client = mockClient();
    client.query
        .mockReturnValueOnce(Promise.resolve({ // componentDidMount: full vocabulary
            data: {
                programmers: [
                    {name: 'Gopher', title: 't', picture: '', company: 'c', skills: [{name: 'Go', icon: '', importance: 1}]},
                    {name: 'Coder', title: 't', picture: '', company: 'c', skills: [{name: 'C++', icon: '', importance: 1}]}
                ]
            }
        }))
        .mockReturnValueOnce(Promise.resolve({ // narrowed search: only Go programmers
            data: {programmers: [{name: 'Gopher', title: 't', picture: '', company: 'c', skills: [{name: 'Go', icon: '', importance: 1}]}]}
        }));

    const {getByPlaceholderText, getAllByRole} = render(<App client={client}/>);
    await flush();

    const input = getByPlaceholderText(/Type skill name/i);
    fireEvent.change(input, {target: {value: 'go'}});
    await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
    });

    // Even though the "go" response only carries Go, "C++" (seen at mount) must
    // still be offered when the user types a "c" prefix afterward.
    fireEvent.change(input, {target: {value: 'c'}});
    const options = getAllByRole('option');
    expect(options.map(o => o.textContent)).toEqual(['C++']);

    // Let the debounced request the typed 'c' queued settle before teardown.
    await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
    });
});

test('suggestions stay visible and interactive while a request is in flight', async () => {
    const pending = deferred();
    const client = mockClient();
    client.query
        .mockReturnValueOnce(Promise.resolve({
            data: {programmers: [{name: 'Coder', title: 't', picture: '', company: 'c', skills: [{name: 'C++', icon: '', importance: 1}]}]}
        }))
        .mockReturnValueOnce(pending.promise);

    const {getByPlaceholderText, getAllByRole} = render(<App client={client}/>);
    await flush();

    const input = getByPlaceholderText(/Type skill name/i);
    fireEvent.change(input, {target: {value: 'c'}});
    await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
    });

    // The request is still pending, but suggestions come from local vocabulary
    // state, so they remain rendered and clickable.
    const options = getAllByRole('option');
    expect(options.map(o => o.textContent)).toEqual(['C++']);
    fireEvent.mouseDown(options[0]);
    expect(input.value).toBe('C++');

    await act(async () => {
        pending.resolve({data: {programmers: []}});
        await Promise.resolve();
    });

    // The selection itself queued its own debounced request; let it settle
    // before the test ends so no state update lands on an unmounted component.
    await act(async () => {
        jest.advanceTimersByTime(300);
        await Promise.resolve();
    });
});
