import React, {Component} from 'react';
import ApolloClient, {gql} from 'apollo-boost';
import {Programmers} from "./programmers/Programmers";
import {SearchBox} from "./search/SearchBox";
import {BarrelRoll} from "./easteregg/BarrelRoll";
import {mergeVocabulary, matchSkills} from "./search/skillMatcher";

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
        // Union of every skill name seen across every programmers response so far,
        // including the mount fetch. Must never shrink when a narrowed search
        // returns fewer programmers - see mergeVocabulary.
        skillVocabulary: [],
        // Locked UX decision: filter, not browse. The list stays closed until the
        // user types; focus alone must never open it.
        suggestionsOpen: false,
        activeSuggestion: -1
    };
    debounceTimer = null;
    latestRequestId = 0;

    // Shared by typing and suggestion selection: both run through the same
    // debounced request path, so there is only ever one place that can fire
    // a request and only one stale-response guard (latestRequestId).
    applySearch = (search, {openSuggestions}) => {
        const trimmed = search.trim();
        this.setState({search: trimmed, suggestionsOpen: openSuggestions, activeSuggestion: -1});

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            this.requestProgrammers(trimmed);
        }, SEARCH_DEBOUNCE_MS);
    };

    updateSearch = (search) => {
        this.applySearch(search, {openSuggestions: true});
    };

    // Reuses the same idiom as clicking a skill chip in Skill.js: set the
    // search to the exact skill name and let the existing debounced path run it.
    selectSuggestion = (name) => {
        this.applySearch(name, {openSuggestions: false});
    };

    suggestions = () => {
        if (!this.state.suggestionsOpen) {
            return [];
        }
        return matchSkills(this.state.skillVocabulary, this.state.search);
    };

    handleSearchKeyDown = (e) => {
        const suggestions = this.suggestions();

        switch (e.key) {
            case "ArrowDown":
                if (suggestions.length === 0) return;
                e.preventDefault();
                this.setState(prev => ({
                    activeSuggestion: prev.activeSuggestion >= suggestions.length - 1 ? 0 : prev.activeSuggestion + 1
                }));
                return;
            case "ArrowUp":
                if (suggestions.length === 0) return;
                e.preventDefault();
                this.setState(prev => ({
                    activeSuggestion: prev.activeSuggestion <= 0 ? suggestions.length - 1 : prev.activeSuggestion - 1
                }));
                return;
            case "Enter": {
                const {activeSuggestion} = this.state;
                if (activeSuggestion >= 0 && activeSuggestion < suggestions.length) {
                    e.preventDefault();
                    this.selectSuggestion(suggestions[activeSuggestion]);
                } else {
                    // No active suggestion: submit the typed text now instead of
                    // waiting out the debounce window.
                    if (this.debounceTimer) {
                        clearTimeout(this.debounceTimer);
                        this.debounceTimer = null;
                    }
                    this.requestProgrammers(this.state.search);
                    this.setState({suggestionsOpen: false, activeSuggestion: -1});
                }
                return;
            }
            case "Escape":
                if (!this.state.suggestionsOpen) return;
                e.preventDefault();
                // Escape closes the list and leaves the typed text intact.
                this.setState({suggestionsOpen: false, activeSuggestion: -1});
                return;
            default:
                return;
        }
    };

    handleSearchBlur = () => {
        this.setState({suggestionsOpen: false, activeSuggestion: -1});
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
            this.setState(prev => ({
                programmers: result.data.programmers,
                loading: false,
                initialLoadComplete: true,
                skillVocabulary: mergeVocabulary(prev.skillVocabulary, result.data.programmers)
            }));
        })
        .catch(error => {
            if (this.unmounted || requestId !== this.latestRequestId) {
                return;
            }
            console.error("Failed to load programmers", error);
            this.setState({loading: false, initialLoadComplete: true});
        });
    }

    render() {
        return <BarrelRoll>
            <div className="container collection">
                <SearchBox search={this.state.search} updateSearch={this.updateSearch}
                           count={this.state.programmers.length} loading={this.state.loading}
                           initialLoadComplete={this.state.initialLoadComplete}
                           suggestions={this.suggestions()} activeSuggestion={this.state.activeSuggestion}
                           suggestionsOpen={this.state.suggestionsOpen}
                           onSelectSuggestion={this.selectSuggestion}
                           onSearchKeyDown={this.handleSearchKeyDown}
                           onSearchBlur={this.handleSearchBlur}/>
                <Programmers programmers={this.state.programmers}
                             search={this.state.search} updateSearch={this.updateSearch}
                             loading={this.state.loading}/>
            </div>
        </BarrelRoll>;
    }
}
