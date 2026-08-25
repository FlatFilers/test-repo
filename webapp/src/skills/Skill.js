import React from "react";
import "./Skill.css";

const MAX_TIER = 3;

/**
 * Skill chips are colored by a tier derived from `importance` (clamped
 * to 1-3) so the visual weight scales with how important the skill is,
 * not just a binary bold/not-bold toggle.
 */
function importanceTier(importance) {
    return Math.max(1, Math.min(MAX_TIER, Math.round(importance || 1)));
}

export function Skill(props) {
    const skill = props.skill;
    const tier = importanceTier(skill.importance);
    const cl = [
        "skill-chip",
        `skill-chip--tier-${tier}`,
        props.highlighted ? "skill-chip--highlighted" : ""
    ].filter(Boolean).join(" ");

    function activate() {
        props.updateSearch(skill.name);
    }

    function handleKeyDown(event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            activate();
        }
    }

    return <div className={cl} role="button" tabIndex={0}
                onClick={activate} onKeyDown={handleKeyDown}
                title={`Filter by ${skill.name}`}>
        {skill.icon && <i className={`fab fa-lg fa-${skill.icon} skill-chip-icon`} aria-hidden="true"/>}
        <span className="skill-chip-name">{skill.name}</span>
    </div>;
}
