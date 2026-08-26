export const RELEVANCE = "relevance";
export const NAME = "name";
export const SKILLS = "skills";

export const DEFAULT_SORT = RELEVANCE;

export const SORT_OPTIONS = [
    {value: RELEVANCE, label: "Best match"},
    {value: NAME, label: "Name A-Z"},
    {value: SKILLS, label: "Most skills"}
];

// Returns a new, sorted array — the source list (component state) is never mutated.
export function sortProgrammers(programmers, sort) {
    const list = [...programmers];
    switch (sort) {
        case NAME:
            return list.sort(byName);
        case SKILLS:
            return list.sort((a, b) => skillCount(b) - skillCount(a) || byName(a, b));
        default:
            // Whatever order the backend returned is the best-match order.
            return list;
    }
}

function byName(a, b) {
    return (a.name || "").localeCompare(b.name || "");
}

function skillCount(programmer) {
    return (programmer.skills || []).length;
}
