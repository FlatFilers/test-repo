import React, {Component} from 'react';
import ApolloClient, {gql} from 'apollo-boost';
import {Programmers} from "./programmers/Programmers";
import {SearchBox} from "./search/SearchBox";
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
        initialLoadComplete: false
    };
    debounceTimer = null;
    latestRequestId = 0;

    updateSearch = (search) => {
        const trimmed = search.trim();
        // Enter the loading state at the keystroke, not when the debounced request
        // fires: during the 300 ms window the rendered results are stale, so the
        // count must not pair the new filter name with the old count (and the
        // empty state must not fire for a query that hasn't run yet).
        this.setState({search: trimmed, loading: true});

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            this.requestProgrammers(trimmed);
        }, SEARCH_DEBOUNCE_MS);
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
            if (skill !== this.state.search) {
                // Response answers an outdated filter (e.g. the full-list request
                // landing while the user already typed): it must not publish its
                // count or clear "Searching..." — the pending debounce will land
                // a response for the current filter.
                return;
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
            if (skill !== this.state.search) {
                // Rejection answers an outdated filter: keep "Searching..." until
                // the pending debounce lands a response for the current filter.
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
                           initialLoadComplete={this.state.initialLoadComplete}/>
                <Programmers programmers={this.state.programmers}
                             search={this.state.search} updateSearch={this.updateSearch}
                             loading={this.state.loading}/>
            </div>
        </BarrelRoll>;
    }
}
