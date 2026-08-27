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
        return <BarrelRoll>
            <div className="container collection">
                <SearchBox search={this.state.search} updateSearch={this.updateSearch}
                           count={this.state.programmers.length} loading={this.state.loading}/>
                <Programmers programmers={this.state.programmers}
                             search={this.state.search} updateSearch={this.updateSearch}
                             loading={this.state.loading}/>
            </div>
        </BarrelRoll>;
    }
}
