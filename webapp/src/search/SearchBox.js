import React from "react";
import "./SearchBox.css";

export function SearchBox(props) {
    return <div className="search-box">
        <label htmlFor="search_string" className="search-box-label">
            <i className="fas fa-search search-box-icon" aria-hidden="true"/>
            <input placeholder="Type a skill to filter, e.g. react, go, python..."
                   id="search_string" type="text" className="search-box-input"
                   autoComplete="off"
                   onChange={e => props.updateSearch(e.target.value)}
                   value={props.search}
            />
            {props.search && <button type="button" className="search-box-clear"
                                      aria-label="Clear search"
                                      onClick={() => props.updateSearch("")}>
                &times;
            </button>}
        </label>
    </div>;
}
