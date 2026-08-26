import React from "react";
import {SORT_OPTIONS} from "./sortProgrammers";
import "./SortSelect.css";

export function SortSelect(props) {
    return <div className="row sort-select">
        <div className="col s12">
            <label className="sort-select__label" htmlFor="sort_order">Sort by</label>
            <select id="sort_order"
                    aria-label="Sort by"
                    className="browser-default sort-select__input"
                    value={props.sort}
                    onChange={e => props.updateSort(e.target.value)}>
                {SORT_OPTIONS.map(option =>
                    <option key={option.value} value={option.value}>{option.label}</option>
                )}
            </select>
        </div>
    </div>;
}
