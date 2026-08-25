import React from "react";
import "./SearchBox.css";

export function SearchBox(props) {
    const hasQuery = props.search.length > 0;
    const clear = () => props.updateSearch("");

    return <div className="row">
        <div className="input-field col s12">
            <input placeholder="Type skill name to filter..."
                   id="search_string" type="text" className="validate search-box__input"
                   onChange={e => props.updateSearch(e.target.value)}
                   value={props.search}
            />
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
            <div className="search-box__count">
                {props.count} {props.count === 1 ? "programmer" : "programmers"}
            </div>
        </div>
    </div>
}
