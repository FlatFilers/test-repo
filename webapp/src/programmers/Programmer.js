import React from "react";
import {Skills} from "../skills/Skills";

/**
 * Cards animate in with a per-card delay derived from their position
 * (`index`) so the list feels alive without JS-driven timers. The
 * delay is capped so long lists don't leave later cards waiting ages.
 */
export function Programmer(props) {
    const pr = props.programmer;
    const staggerDelay = `${Math.min(props.index, 8) * 60}ms`;

    return <div className="programmer-card" style={{animationDelay: staggerDelay}}>
        <div className="programmer-avatar-wrap">
            {pr.picture
                ? <img src={pr.picture} alt="" className="programmer-avatar"/>
                : <div className="programmer-avatar programmer-avatar-fallback" aria-hidden="true">
                    {pr.name ? pr.name.charAt(0).toUpperCase() : "?"}
                </div>}
        </div>
        <div className="programmer-info">
            <span className="programmer-name">{pr.name}</span>
            <span className="programmer-company">{pr.title} @ {pr.company}</span>
            <Skills skills={pr.skills} search={props.search} updateSearch={props.updateSearch}/>
        </div>
    </div>;
}
