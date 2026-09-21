import React from "react";
import "./SearchBox.css";
import {SkillSuggestions} from "./SkillSuggestions";

export function SearchBox(props) {
    const hasQuery = props.search.length > 0;
    const clear = () => props.updateSearch("");

    const countLabel = `${props.count} ${props.count === 1 ? "programmer" : "programmers"}`;
    const countText = hasQuery ? `${countLabel} with ${props.search}` : countLabel;

    const suggestions = props.suggestions || [];
    const suggestionsOpen = Boolean(props.suggestionsOpen) && suggestions.length > 0;
    const activeSuggestion = props.activeSuggestion;
    const hasActiveSuggestion = activeSuggestion >= 0 && activeSuggestion < suggestions.length;

    return <div className="row">
        <div className="input-field col s12">
            <input placeholder="Type skill name to filter..."
                   id="search_string" type="text" className="validate search-box__input"
                   onChange={e => props.updateSearch(e.target.value)}
                   onKeyDown={props.onSearchKeyDown}
                   onBlur={props.onSearchBlur}
                   value={props.search}
                   role="combobox"
                   aria-expanded={suggestionsOpen}
                   aria-controls="skill-suggestions"
                   aria-autocomplete="list"
                   {...(hasActiveSuggestion ? {"aria-activedescendant": `skill-suggestion-${activeSuggestion}`} : {})}
            />
            {suggestionsOpen &&
                <SkillSuggestions suggestions={suggestions} activeIndex={activeSuggestion}
                                   onSelect={props.onSelectSuggestion}/>
            }
            {hasQuery &&
                <i className="fas fa-times search-box__clear"
                   onClick={clear}
                   role="button"
                   aria-label="Clear search"
                />
            }
            {props.loading &&
                <div className="search-box__loading" role="status" aria-label="Searching">
                    Searching...
                </div>
            }
            {/* Neutralized until the first fetch resolves, so we never flash "0 programmers". */}
            {props.initialLoadComplete &&
                <div className="search-box__count">
                    {countText}
                </div>
            }
        </div>
    </div>
}
