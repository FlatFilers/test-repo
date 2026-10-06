import React from 'react';
import {render} from '@testing-library/react';
import {Programmer} from './Programmer';

test('renders the skill count for a programmer with a known number of skills', () => {
    const programmer = {
        name: "Ada Lovelace",
        title: "Engineer",
        company: "Analytical Engines Inc",
        picture: "",
        skills: [
            {name: "Java", importance: 1},
            {name: "Go", importance: 2},
            {name: "Rust", importance: 1}
        ]
    };
    const {getByText} = render(<Programmer programmer={programmer}/>);
    const element = getByText(/3 skills/i);
    expect(element).toBeInTheDocument();
});
