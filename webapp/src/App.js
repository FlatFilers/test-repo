import React, {Component} from 'react';
import ApolloClient, {gql} from 'apollo-boost';
import {Programmers} from "./programmers/Programmers";
import {SearchBox} from "./search/SearchBox";
import {LoadingState} from "./programmers/LoadingState";
import {EmptyState} from "./programmers/EmptyState";
import {Confetti} from "./effects/Confetti";
import {useKonamiCode} from "./hooks/useKonamiCode";
import {usePrefersReducedMotion} from "./hooks/usePrefersReducedMotion";
import './App.css';

/**
 * Wraps the class-based App with the Konami-code easter egg. Kept as a
 * thin functional wrapper so the data-fetching class component doesn't
 * need to change shape just to use hooks.
 */
function EasterEgg() {
    const [celebrating, setCelebrating] = React.useState(false);
    const reducedMotion = usePrefersReducedMotion();

    useKonamiCode(React.useCallback(() => {
        if (!reducedMotion) {
            setCelebrating(true);
        }
    }, [reducedMotion]));

    React.useEffect(() => {
        if (!celebrating) {
            return;
        }
        const timeout = setTimeout(() => setCelebrating(false), 3200);
        return () => clearTimeout(timeout);
    }, [celebrating]);

    return celebrating ? <Confetti/> : null;
}

export class App extends Component {
    client = new ApolloClient({
        uri: `${process.env.REACT_APP_API_URL}/query`
    });
    state = {
        programmers: [],
        search: "",
        loading: true,
        error: null
    };
    updateSearch = (search) => {
        this.setState({search: search.trim()});
        this.requestProgrammers(search.trim())
    };

    componentDidMount() {
        this.requestProgrammers(this.state.search);
    }

    requestProgrammers(search) {
        this.setState({loading: true, error: null});
        this.client.query({
            query: gql`
                {
                    programmers(skill: "${search}") {
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
            `
        })
        .then(result => this.setState({
            programmers: result.data.programmers,
            loading: false
        }))
        .catch(error => this.setState({
            programmers: [],
            loading: false,
            error
        }));
    }

    renderResults() {
        if (this.state.loading) {
            return <LoadingState/>;
        }
        if (this.state.error || this.state.programmers.length === 0) {
            return <EmptyState search={this.state.search}
                                isError={Boolean(this.state.error)}
                                onClearSearch={this.updateSearch}/>;
        }
        return <Programmers programmers={this.state.programmers}
                             search={this.state.search} updateSearch={this.updateSearch}/>;
    }

    render() {
        return <div className="app">
            <EasterEgg/>
            <header className="app-header">
                <h1 className="app-title">
                    <span className="app-title-emoji" aria-hidden="true">&#128640;</span> S.K.M.Z.
                </h1>
                <p className="app-tagline">Find your dream teammate by skill</p>
            </header>
            <main className="app-content">
                <SearchBox search={this.state.search} updateSearch={this.updateSearch}/>
                {this.renderResults()}
            </main>
        </div>;
    }
}
