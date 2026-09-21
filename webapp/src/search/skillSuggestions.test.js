import {MAX_SUGGESTIONS, collectSkillNames, mergeVocabulary, matchSkills} from './skillSuggestions';

// Mirrors the real seeded vocabulary (28 distinct skill names across 8 programmers).
const SEEDED_SKILLS = [
    'AWS', 'Alamofire', 'Android', 'Angular', 'Azure', 'C#', 'C++', 'CSS',
    'Express', 'GORM', 'Go', 'Gorilla/Mux', 'HTML', 'Hibernate', 'JPA', 'Java',
    'JavaScript', 'Node.js', 'Objective C', 'Python', 'REST', 'React', 'Redux',
    'Rust', 'Spring Boot', 'Swift', 'SwiftLint', 'TypeScript'
];

function programmerWith(...names) {
    return {skills: names.map(name => ({name}))};
}

const SEEDED_PROGRAMMERS = [
    programmerWith('Go', 'GORM', 'Gorilla/Mux', 'REST'),
    programmerWith('Java', 'JavaScript', 'Spring Boot', 'JPA', 'Hibernate'),
    programmerWith('C#', 'C++', 'CSS', 'HTML'),
    programmerWith('Python', 'Django', 'AWS'),
    programmerWith('React', 'Redux', 'TypeScript', 'Node.js'),
    programmerWith('Swift', 'SwiftLint', 'Objective C', 'Alamofire'),
    programmerWith('Rust', 'Angular', 'Azure'),
    programmerWith('Android', 'Express')
];

// Django is not part of the real seeded vocabulary list; drop it so the fixture
// matches SEEDED_SKILLS exactly.
SEEDED_PROGRAMMERS[3] = programmerWith('Python', 'AWS');

test('collectSkillNames returns the distinct names across all programmers', () => {
    const names = collectSkillNames(SEEDED_PROGRAMMERS);

    expect(names.size).toBe(SEEDED_SKILLS.length);
    SEEDED_SKILLS.forEach(name => expect(names.has(name)).toBe(true));
});

test('collectSkillNames tolerates null/undefined programmers', () => {
    expect(() => collectSkillNames(null)).not.toThrow();
    expect(() => collectSkillNames(undefined)).not.toThrow();
    expect(Array.from(collectSkillNames(null))).toEqual([]);
});

test('collectSkillNames tolerates malformed rows without throwing', () => {
    const malformed = [
        null,
        undefined,
        {},
        {skills: null},
        {skills: 'not-an-array'},
        {skills: [null, {}, {name: null}, {name: '   '}, {name: ''}]},
        {skills: [{name: 'Go'}]}
    ];

    let names;
    expect(() => { names = collectSkillNames(malformed); }).not.toThrow();
    expect(Array.from(names)).toEqual(['Go']);
});

test('mergeVocabulary unions existing entries with newly-seen ones, sorted', () => {
    const merged = mergeVocabulary(['Go'], [programmerWith('Java', 'C++')]);

    expect(merged).toEqual(['C++', 'Go', 'Java']);
});

test('mergeVocabulary never shrinks when a later response is narrower', () => {
    const initial = mergeVocabulary([], SEEDED_PROGRAMMERS);
    expect(initial.length).toBe(SEEDED_SKILLS.length);

    // A search narrowed to "go" only returns Go programmers' skills.
    const narrowed = mergeVocabulary(initial, [programmerWith('Go', 'GORM', 'Gorilla/Mux', 'REST')]);

    expect(narrowed.length).toBe(SEEDED_SKILLS.length);
    expect(narrowed).toEqual(initial);
});

test('matchSkills returns [] for blank or whitespace-only input', () => {
    expect(matchSkills(SEEDED_SKILLS, '')).toEqual([]);
    expect(matchSkills(SEEDED_SKILLS, '   ')).toEqual([]);
});

test('matchSkills is case-insensitive prefix matching', () => {
    expect(matchSkills(SEEDED_SKILLS, 'c')).toEqual(['C#', 'C++', 'CSS']);
    expect(matchSkills(SEEDED_SKILLS, 'GO')).toEqual(['GORM', 'Go', 'Gorilla/Mux']);
});

test('matchSkills narrows correctly on a longer prefix', () => {
    expect(matchSkills(SEEDED_SKILLS, 'c+')).toEqual(['C++']);
});

test('matchSkills closes the list when the sole match equals the query', () => {
    expect(matchSkills(SEEDED_SKILLS, 'C++')).toEqual([]);
});

test('matchSkills keeps both candidates when an exact match has a sibling', () => {
    // The subtle case: typing "java" exactly matches "Java" but must not hide
    // "JavaScript", since only a *sole* exact match closes the list.
    expect(matchSkills(SEEDED_SKILLS, 'java')).toEqual(['Java', 'JavaScript']);
});

test('matchSkills returns [] when nothing matches', () => {
    expect(matchSkills(SEEDED_SKILLS, 'zzz')).toEqual([]);
});

test('matchSkills does not throw on regex-special characters', () => {
    expect(() => matchSkills(SEEDED_SKILLS, '(')).not.toThrow();
    expect(matchSkills(SEEDED_SKILLS, '(')).toEqual([]);
});

test('matchSkills caps results at the provided limit, defaulting to MAX_SUGGESTIONS', () => {
    const vocabulary = Array.from({length: 17}, (_, i) => `Skill${String(i).padStart(2, '0')}`);

    expect(matchSkills(vocabulary, 'skill').length).toBe(MAX_SUGGESTIONS);
    expect(matchSkills(vocabulary, 'skill', 3).length).toBe(3);
});
