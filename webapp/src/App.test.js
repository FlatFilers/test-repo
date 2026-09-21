import React from 'react';
import {render, fireEvent} from '@testing-library/react';
import {act} from 'react-dom/test-utils';
import {App} from './App';

function operationName(queryDoc) {
    return queryDoc.definitions[0].name.value;
}

// Creates a mock Apollo client compatible with `client.query(...)`. Every
// debounced search now fires both the Programmers and Skills queries, so the
// mock dispatches by GraphQL operation name (not call order) and lets each
// test supply per-query behavior independently.
function mockClient({
    programmers = () => Promise.resolve({data: {programmers: []}}),
    skills = () => Promise.resolve({data: {skills: []}})
} = {}) {
    const query = jest.fn(({query: queryDoc, variables}) => {
        return operationName(queryDoc) === 'Skills' ? skills(variables) : programmers(variables);
    });
    return {query};
}

function callsFor(client, opName) {
    return client.query.mock.calls.filter(([{query: queryDoc}]) => operationName(queryDoc) === opName);
}

// The pinned @testing-library/react (9.4.0) does not reliably filter
// role="option" elements by accessible name, so suggestion rows are looked
// up by their text content instead.
function optionWithText(container, text) {
    const {getAllByRole} = container;
    return getAllByRole('option').find(el => el.textContent === text);
}

function deferred() {
    let resolve;
    const promise = new Promise(res => {
        resolve = res;
    });
    return {promise, resolve};
}

const flush = () => act(() => Promise.resolve());
const advanceDebounce = () => act(async () => {
    jest.advanceTimersByTime(300);
    await Promise.resolve();
});

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
    await advanceDebounce();

    const programmersCalls = callsFor(client, 'Programmers');
    const lastCall = programmersCalls[programmersCalls.length - 1][0];
    expect(lastCall.variables).toEqual({skill: maliciousInput});
    // The query document itself must never contain the raw user input.
    expect(lastCall.query.loc.source.body).not.toContain(maliciousInput);
    expect(lastCall.query.loc.source.body).toContain('$skill');
});

test('debounces a burst of typing into a single request per query', async () => {
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

    await advanceDebounce();

    expect(callsFor(client, 'Programmers')).toHaveLength(1);
    expect(callsFor(client, 'Programmers')[0][0].variables).toEqual({skill: 'java'});
    expect(callsFor(client, 'Skills')).toHaveLength(1);
    expect(callsFor(client, 'Skills')[0][0].variables).toEqual({prefix: 'java'});
});

test('ignores a stale programmers response so an older request cannot overwrite newer results', async () => {
    const rubyResponse = deferred();
    const goResponse = deferred();
    const responses = {ruby: rubyResponse.promise, go: goResponse.promise};
    const client = mockClient({
        programmers: (vars) => vars.skill === '' ? Promise.resolve({data: {programmers: []}}) : responses[vars.skill]
    });

    const {getByPlaceholderText, queryByText} = render(<App client={client}/>);
    await flush();

    const input = getByPlaceholderText(/Type skill name/i);

    fireEvent.change(input, {target: {value: 'ruby'}});
    await advanceDebounce();

    fireEvent.change(input, {target: {value: 'go'}});
    await advanceDebounce();

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
    const client = mockClient({
        programmers: (vars) => vars.skill === '' ? Promise.resolve({data: {programmers: []}}) : pending.promise
    });

    const {getByPlaceholderText, queryByText, getByRole} = render(<App client={client}/>);
    await flush();

    fireEvent.change(getByPlaceholderText(/Type skill name/i), {target: {value: 'rust'}});
    await advanceDebounce();

    expect(getByRole('status')).toBeInTheDocument();
    expect(queryByText(/No programmers match/)).not.toBeInTheDocument();

    await act(async () => {
        pending.resolve({data: {programmers: []}});
        await Promise.resolve();
    });

    expect(queryByText(/No programmers match/)).toBeInTheDocument();
});

test('shows a live result count that matches the rendered rows and names the active filter', async () => {
    const client = mockClient({
        programmers: (vars) => vars.skill === '' ? Promise.resolve({data: {programmers: []}}) : Promise.resolve({
            data: {
                programmers: [
                    {name: 'Gopher One', title: 't', picture: '', company: 'c', skills: []},
                    {name: 'Gopher Two', title: 't', picture: '', company: 'c', skills: []},
                    {name: 'Gopher Three', title: 't', picture: '', company: 'c', skills: []}
                ]
            }
        })
    });

    const {getByPlaceholderText, getByText, container} = render(<App client={client}/>);
    await flush();

    fireEvent.change(getByPlaceholderText(/Type skill name/i), {target: {value: 'go'}});
    await advanceDebounce();

    expect(container.querySelectorAll('.collection-item')).toHaveLength(3);
    expect(getByText('3 programmers with go')).toBeInTheDocument();
});

test('stops loading and does not crash when the programmers query rejects', async () => {
    const client = mockClient({
        programmers: (vars) => vars.skill === '' ? Promise.resolve({data: {programmers: []}}) : Promise.reject(new Error('network error'))
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const {getByPlaceholderText, queryByRole} = render(<App client={client}/>);
    await flush();

    fireEvent.change(getByPlaceholderText(/Type skill name/i), {target: {value: 'rust'}});
    await advanceDebounce();

    expect(queryByRole('status')).not.toBeInTheDocument();

    console.error.mockRestore();
});

// F2: selecting a suggestion is an explicit commit -- it searches
// immediately, bypassing the 300ms debounce entirely.
test('selecting a suggestion fires the programmers request without waiting for the debounce', async () => {
    const client = mockClient({
        skills: (vars) => vars.prefix === '' ? Promise.resolve({data: {skills: []}}) : Promise.resolve({data: {skills: ['Go', 'GORM']}})
    });

    const {getByPlaceholderText, getAllByRole} = render(<App client={client}/>);
    await flush();

    fireEvent.change(getByPlaceholderText(/Type skill name/i), {target: {value: 'go'}});
    await advanceDebounce();

    client.query.mockClear();

    fireEvent.mouseDown(optionWithText({getAllByRole}, 'Go'));

    // No timer advance: the commit must be synchronous, not debounced.
    await flush();

    expect(callsFor(client, 'Programmers')).toHaveLength(1);
    expect(callsFor(client, 'Programmers')[0][0].variables).toEqual({skill: 'Go'});
    expect(getByPlaceholderText(/Type skill name/i).value).toBe('Go');
});

// F3: Arrow Down/Up move and wrap the highlight, Enter commits the
// highlighted row, and Escape closes the list while preserving typed text.
test('keyboard navigation wraps, Enter commits, and Escape preserves the typed text', async () => {
    const client = mockClient({
        skills: (vars) => vars.prefix === '' ? Promise.resolve({data: {skills: []}}) : Promise.resolve({data: {skills: ['Go', 'GORM']}})
    });

    const {getByPlaceholderText, getAllByRole, queryByRole} = render(<App client={client}/>);
    await flush();

    const input = getByPlaceholderText(/Type skill name/i);
    fireEvent.change(input, {target: {value: 'go'}});
    await advanceDebounce();

    // Wraps past the last option back to the first.
    fireEvent.keyDown(input, {key: 'ArrowUp'});
    expect(optionWithText({getAllByRole}, 'GORM')).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(input, {key: 'ArrowDown'});
    expect(optionWithText({getAllByRole}, 'Go')).toHaveAttribute('aria-selected', 'true');

    client.query.mockClear();
    fireEvent.keyDown(input, {key: 'Enter'});
    await flush();

    expect(input.value).toBe('Go');
    expect(callsFor(client, 'Programmers')).toHaveLength(1);
    expect(queryByRole('listbox')).not.toBeInTheDocument();

    // Reopen and verify Escape closes without touching the typed text.
    fireEvent.change(input, {target: {value: 'go'}});
    await advanceDebounce();
    expect(queryByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(input, {key: 'Escape'});
    expect(queryByRole('listbox')).not.toBeInTheDocument();
    expect(input.value).toBe('go');
});

// F5: a failing skills query must never break search -- the dropdown simply
// does not appear, and no unhandled rejection escapes.
test('a rejecting skills query leaves programmer search fully functional', async () => {
    const client = mockClient({
        programmers: (vars) => vars.skill === '' ? Promise.resolve({data: {programmers: []}}) : Promise.resolve({
            data: {programmers: [{name: 'Gopher', title: 't', picture: '', company: 'c', skills: []}]}
        }),
        skills: (vars) => vars.prefix === '' ? Promise.resolve({data: {skills: []}}) : Promise.reject(new Error('skills unavailable'))
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const {getByPlaceholderText, queryByText, queryByRole} = render(<App client={client}/>);
    await flush();

    fireEvent.change(getByPlaceholderText(/Type skill name/i), {target: {value: 'go'}});
    await advanceDebounce();

    expect(queryByText('Gopher')).toBeInTheDocument();
    expect(queryByRole('listbox')).not.toBeInTheDocument();

    console.error.mockRestore();
});

// F6: a stale suggestions response must never overwrite a newer one.
test('a stale skills response never overwrites the newer prefix suggestions', async () => {
    const goSkills = deferred();
    const rustSkills = deferred();
    const responses = {go: goSkills.promise, rust: rustSkills.promise};
    const client = mockClient({
        skills: (vars) => vars.prefix === '' ? Promise.resolve({data: {skills: []}}) : responses[vars.prefix]
    });

    const {getByPlaceholderText, getAllByRole, queryByText} = render(<App client={client}/>);
    await flush();

    const input = getByPlaceholderText(/Type skill name/i);

    fireEvent.change(input, {target: {value: 'go'}});
    await advanceDebounce();

    fireEvent.change(input, {target: {value: 'rust'}});
    await advanceDebounce();

    // The newer ("rust") response resolves first...
    await act(async () => {
        rustSkills.resolve({data: {skills: ['Rust']}});
        await Promise.resolve();
    });
    expect(optionWithText({getAllByRole}, 'Rust')).toBeInTheDocument();

    // ...then the stale ("go") response resolves late and must be ignored.
    await act(async () => {
        goSkills.resolve({data: {skills: ['Go', 'GORM']}});
        await Promise.resolve();
    });
    expect(queryByText('Go')).not.toBeInTheDocument();
    expect(optionWithText({getAllByRole}, 'Rust')).toBeInTheDocument();
});
