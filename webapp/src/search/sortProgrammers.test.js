import {NAME, RELEVANCE, SKILLS, sortProgrammers} from './sortProgrammers';

const programmer = (name, skillCount) => ({
    name,
    title: 't',
    picture: '',
    company: 'c',
    skills: Array.from({length: skillCount}, (_, i) => ({name: `s${i}`, icon: '', importance: 1}))
});

const charlie = programmer('Charlie', 3);
const alice = programmer('Alice', 1);
const bob = programmer('Bob', 3);

const names = list => list.map(p => p.name);

test('keeps the backend order for best match', () => {
    const source = [charlie, alice, bob];
    expect(names(sortProgrammers(source, RELEVANCE))).toEqual(['Charlie', 'Alice', 'Bob']);
});

test('sorts by name', () => {
    expect(names(sortProgrammers([charlie, alice, bob], NAME))).toEqual(['Alice', 'Bob', 'Charlie']);
});

test('sorts by skill count, breaking ties by name', () => {
    expect(names(sortProgrammers([charlie, alice, bob], SKILLS))).toEqual(['Bob', 'Charlie', 'Alice']);
});

test('never mutates the source list', () => {
    const source = [charlie, alice, bob];
    sortProgrammers(source, NAME);
    expect(names(source)).toEqual(['Charlie', 'Alice', 'Bob']);
});

test('tolerates programmers without skills', () => {
    const noSkills = {name: 'Dana'};
    expect(names(sortProgrammers([alice, noSkills], SKILLS))).toEqual(['Alice', 'Dana']);
});
