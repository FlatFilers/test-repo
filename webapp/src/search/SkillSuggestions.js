import React from "react";
import "./SkillSuggestions.css";

export function SkillSuggestions(props) {
    const {suggestions, activeIndex, onSelect} = props;

    if (!suggestions || suggestions.length === 0) {
        return null;
    }

    return <ul id="skill-suggestions" className="skill-suggestions" role="listbox">
        {suggestions.map((name, index) => {
            const active = index === activeIndex;
            return <li key={name}
                       id={`skill-suggestion-${index}`}
                       role="option"
                       aria-selected={active}
                       className={active ? "skill-suggestions__item skill-suggestions__item--active" : "skill-suggestions__item"}
                       // Selection must fire before the input's blur handler closes this list, so we
                       // commit on mousedown rather than click, and preventDefault to keep focus on
                       // the input (otherwise blur fires first and the click lands on nothing).
                       onMouseDown={e => {
                           e.preventDefault();
                           onSelect(name);
                       }}
            >
                {name}
            </li>;
        })}
    </ul>;
}
