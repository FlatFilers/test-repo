import React from "react";
import {Programmer} from "./Programmer";
import "./Progremmer.css";

export function Programmers(props) {
    if (!props.loading && props.programmers.length === 0 && props.search.length > 0) {
        return <div className="row">
            <p className="col s12 center-align grey-text">
                No programmers match "{props.search}". Try a different skill.
            </p>
        </div>
    }

    const programmers = props.programmers.map(
        (pr, i) => <Programmer programmer={pr} key={i}
                               search={props.search}
                               updateSearch={props.updateSearch}/>
    );
    return <div>{programmers}</div>
}
