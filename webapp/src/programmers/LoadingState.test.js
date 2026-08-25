import React from 'react';
import {render} from '@testing-library/react';
import {LoadingState} from './LoadingState';

test('renders a friendly loading message', () => {
    const {getByRole} = render(<LoadingState/>);
    expect(getByRole('status')).toBeInTheDocument();
});
