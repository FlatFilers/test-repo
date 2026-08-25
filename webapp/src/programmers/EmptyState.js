import React from "react";

/**
 * Shown when a search returns zero programmers, or when the API could
 * not be reached at all (`isError`). Gives the user a clear next step
 * instead of a blank page.
 */
export function EmptyState({search, isError, onClearSearch}) {
    if (isError) {
        return <div className="state-panel empty-state" role="alert">
            <div className="empty-state-emoji" aria-hidden="true">&#9888;&#65039;</div>
            <p className="empty-state-title">Couldn't reach the programmer directory</p>
            <p className="empty-state-hint">
                The API might be offline right now &mdash; try again in a bit.
            </p>
        </div>;
    }

    return <div className="state-panel empty-state" role="status">
        <div className="empty-state-emoji" aria-hidden="true">&#128269;</div>
        <p className="empty-state-title">
            {search
                ? <>No programmers match &ldquo;{search}&rdquo;</>
                : <>No programmers found</>}
        </p>
        <p className="empty-state-hint">Try a different skill, like "react" or "go".</p>
        {search && <button type="button" className="empty-state-clear" onClick={() => onClearSearch("")}>
            Clear search
        </button>}
    </div>;
}
