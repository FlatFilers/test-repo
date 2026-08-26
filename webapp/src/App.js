import React, {Component} from 'react';
import ApolloClient, {gql} from 'apollo-boost';
import {Programmers} from "./programmers/Programmers";
import {SearchBox} from "./search/SearchBox";

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_QUERY_PARAM = "skill";

// The current search lives in the URL (?skill=go) so a filtered view can be
// bookmarked, shared, and restored with the browser's back/forward buttons.
function searchFromUrl() {
    if (typeof window === "undefined" || !window.location) {
        return "";
    }
    return new URLSearchParams(window.location.search).get(SEARCH_QUERY_PARAM) || "";
}

function writeSearchToUrl(search) {
    if (typeof window === "undefined" || !window.history || !window.history.replaceState) {
        return;
    }
    const params = new URLSearchParams(window.location.search);
    if (search) {
        params.set(SEARCH_QUERY_PARAM, search);
    } else {
        params.delete(SEARCH_QUERY_PARAM);
    }
    const query = params.toString();
    // replaceState, not pushState: typing must not bury the previous page
    // under one history entry per search.
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
}

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
        search: searchFromUrl(),
        loading: false
    };
    debounceTimer = null;
    latestRequestId = 0;

    updateSearch = (search) => {
        const trimmed = search.trim();
        this.setState({search: trimmed});

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            writeSearchToUrl(trimmed);
            this.requestProgrammers(trimmed);
        }, SEARCH_DEBOUNCE_MS);
    };

    // Back/forward (or a hand-edited URL) is the source of truth: adopt the
    // term from the URL without writing it back.
    handlePopState = () => {
        const search = searchFromUrl();
        if (search === this.state.search) {
            return;
        }
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.setState({search});
        this.requestProgrammers(search);
    };

    componentDidMount() {
        this.requestProgrammers(this.state.search);
        if (typeof window !== "undefined") {
            window.addEventListener("popstate", this.handlePopState);
        }
    }

    componentWillUnmount() {
        this.unmounted = true;
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        if (typeof window !== "undefined") {
            window.removeEventListener("popstate", this.handlePopState);
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
                loading: false
            });
        })
        .catch(error => {
            if (this.unmounted || requestId !== this.latestRequestId) {
                return;
            }
            console.error("Failed to load programmers", error);
            this.setState({loading: false});
        });
    }

    render() {
        return <div className="container collection">
            <SearchBox search={this.state.search} updateSearch={this.updateSearch}
                       count={this.state.programmers.length} loading={this.state.loading}/>
            <Programmers programmers={this.state.programmers}
                         search={this.state.search} updateSearch={this.updateSearch}
                         loading={this.state.loading}/>
        </div>;
    }
}
