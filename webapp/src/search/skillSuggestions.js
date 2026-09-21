export const MAX_SUGGESTIONS = 8;

/**
 * Collects distinct skill names from a programmers array.
 * Tolerates missing/!Array skills, and skips blank names.
 */
export function collectSkillNames(programmers) {
    const names = new Set();
    (programmers || []).forEach(programmer => {
        const skills = (programmer && programmer.skills) || [];
        if (!Array.isArray(skills)) return;
        skills.forEach(skill => {
            const name = skill && skill.name;
            if (typeof name === "string" && name.trim().length > 0) {
                names.add(name);
            }
        });
    });
    return names;
}

/**
 * Unions newly-seen skill names into the known vocabulary.
 *
 * The vocabulary must never shrink: once the user filters to "go", the response
 * only carries Go programmers' skills, but the suggestion list should still
 * offer everything seen since mount. Returns a sorted array.
 */
export function mergeVocabulary(existing, programmers) {
    const merged = new Set(existing || []);
    collectSkillNames(programmers).forEach(name => merged.add(name));
    return Array.from(merged).sort((a, b) => a.localeCompare(b));
}

/**
 * Case-insensitive prefix match, mirroring the server's ^prefix.*$ semantics
 * so a suggestion always yields at least one result once selected.
 *
 * Returns [] for blank input and for an exact case-insensitive match on the
 * only candidate, so the list closes instead of suggesting what is already typed.
 */
export function matchSkills(vocabulary, search, limit = MAX_SUGGESTIONS) {
    const query = (search || "").trim().toLowerCase();
    if (query.length === 0) return [];

    const matches = (vocabulary || []).filter(
        name => name.toLowerCase().startsWith(query)
    );

    if (matches.length === 1 && matches[0].toLowerCase() === query) return [];

    return matches.slice(0, limit);
}
