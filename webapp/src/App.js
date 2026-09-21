import React, {Component} from 'react';
import ApolloClient, {gql} from 'apollo-boost';
import {Programmers} from "./programmers/Programmers";
import {SearchBox} from "./search/SearchBox";
import {SkillSuggestions} from "./search/SkillSuggestions";
import {BarrelRoll} from "./easteregg/BarrelRoll";

const SEARCH_DEBOUNCE_MS = 300;

const PROGRAMMERS_QUERY = gql`
    query Programmers($skill: String!) {
        programmers(skill: $skill) {
            name,
            title,
            picture,
            company,
            skills{
                name,
                icon,
                importance
            }
        }
    }
`;

const SKILLS_QUERY = gql`
    query Skills($prefix: String!) {
        skills(prefix: $prefix)
    }
`;

export class App extends Component {
    client = this.props.client || new ApolloClient({
        uri: `${process.env.REACT_APP_API_URL}/query`
    });
    state = {
        programmers: [],
        search: "",
        loading: false,
        // Tracks whether the very first fetch (on mount) has resolved, so the
        // result count can stay neutralized until there's a real number to show.
        initialLoadComplete: false,
        suggestions: [],
        suggestionsOpen: false,
        activeIndex: -1
    };
    debounceTimer = null;
    latestRequestId = 0;
    // Separate counter from latestRequestId: the programmers and skills
    // queries are independent requests and must not invalidate each other's
    // stale-response guard.
    latestSuggestionRequestId = 0;

    updateSearch = (search) => {
        const trimmed = search.trim();
        this.setState({search: trimmed, suggestionsOpen: true, activeIndex: -1});

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            this.requestProgrammers(trimmed);
            this.requestSuggestions(trimmed);
        }, SEARCH_DEBOUNCE_MS);
    };

    // Selecting a suggestion is an explicit commit: search immediately, no
    // debounce, and close the list. A click that waits 300ms to react feels
    // broken.
    selectSuggestion = (name) => {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.setState({search: name, suggestionsOpen: false, activeIndex: -1});
        this.requestProgrammers(name);
    };

    closeSuggestions = () => {
        this.setState({suggestionsOpen: false, activeIndex: -1});
    };

    hoverSuggestion = (index) => {
        this.setState({activeIndex: index});
    };

    handleKeyDown = (e) => {
        const {suggestionsOpen, suggestions, activeIndex} = this.state;
        if (!suggestionsOpen || suggestions.length === 0) {
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                // -1 (nothing highlighted yet) steps to the first row; any
                // other index wraps forward normally.
                this.setState({activeIndex: activeIndex < 0 ? 0 : (activeIndex + 1) % suggestions.length});
                break;
            case "ArrowUp":
                e.preventDefault();
                // -1 (nothing highlighted yet) steps to the last row, not the
                // first -- otherwise both arrows would land on the same row
                // on first press.
                this.setState({
                    activeIndex: activeIndex < 0
                        ? suggestions.length - 1
                        : (activeIndex - 1 + suggestions.length) % suggestions.length
                });
                break;
            case "Enter":
                if (activeIndex >= 0) {
                    e.preventDefault();
                    this.selectSuggestion(suggestions[activeIndex]);
                }
                break;
            case "Escape":
                // Preserve typed text -- Escape closes the list, it never clears the input.
                this.closeSuggestions();
                break;
            default:
                break;
        }
    };

    componentDidMount() {
        this.requestProgrammers(this.state.search);
    }

    componentWillUnmount() {
        this.unmounted = true;
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
    }

    requestProgrammers(skill) {
        const requestId = ++this.latestRequestId;
        this.setState({loading: true});

        this.client.query({
            query: PROGRAMMERS_QUERY,
            variables: {skill},
            fetchPolicy: "network-only"
        })
        .then(result => {
            if (this.unmounted || requestId !== this.latestRequestId) {
                return; // unmounted, or a newer search has already superseded this response
            }
            this.setState({
                programmers: result.data.programmers,
                loading: false,
                initialLoadComplete: true
            });
        })
        .catch(error => {
            if (this.unmounted || requestId !== this.latestRequestId) {
                return;
            }
            console.error("Failed to load programmers", error);
            this.setState({loading: false, initialLoadComplete: true});
        });
    }

    requestSuggestions(prefix) {
        const requestId = ++this.latestSuggestionRequestId;

        this.client.query({
            query: SKILLS_QUERY,
            variables: {prefix},
            fetchPolicy: "network-only"
        })
        .then(result => {
            if (this.unmounted || requestId !== this.latestSuggestionRequestId) {
                return; // a newer keystroke already superseded this response
            }
            this.setState({suggestions: result.data.skills});
        })
        .catch(error => {
            if (this.unmounted || requestId !== this.latestSuggestionRequestId) {
                return;
            }
            // A suggestion failure must never break search: drop the list silently.
            console.error("Failed to load skill suggestions", error);
            this.setState({suggestions: []});
        });
    }

    render() {
        const {search, suggestions, suggestionsOpen, activeIndex} = this.state;
        const showSuggestions = suggestionsOpen && suggestions.length > 0;
        return <BarrelRoll>
            <div className="container collection">
                <div className="autocomplete" onKeyDown={this.handleKeyDown}>
                    <SearchBox search={search} updateSearch={this.updateSearch}
                               count={this.state.programmers.length} loading={this.state.loading}
                               initialLoadComplete={this.state.initialLoadComplete}
                               onBlur={this.closeSuggestions}
                               expanded={showSuggestions}
                               activeOptionId={activeIndex >= 0 ? `skill-suggestion-${activeIndex}` : undefined}/>
                    {showSuggestions &&
                        <SkillSuggestions suggestions={suggestions} activeIndex={activeIndex}
                                          onSelect={this.selectSuggestion} onHover={this.hoverSuggestion}/>
                    }
                </div>
                <Programmers programmers={this.state.programmers}
                             search={this.state.search} updateSearch={this.updateSearch}
                             loading={this.state.loading}/>
            </div>
        </BarrelRoll>;
    }
}
