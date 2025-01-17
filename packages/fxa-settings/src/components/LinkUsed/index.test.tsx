/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { render, screen } from '@testing-library/react';
import LinkUsed from '.';

describe('LinkUsed', () => {
  it('renders the component as expected for a link already used to verify a primary email address', () => {
    render(<LinkUsed isForPrimaryEmail={true} />);

    screen.getByRole('heading', {
      name: 'Primary email already confirmed',
    });
    screen.getByText(
      'That confirmation link was already used, and can only be used once.'
    );
  });

  it('renders the component as expected for a Used Signin link', () => {
    render(<LinkUsed isForPrimaryEmail={false} />);

    screen.getByRole('heading', {
      name: 'Sign-in already confirmed',
    });
    screen.getByText(
      'That confirmation link was already used, and can only be used once.'
    );
  });
});
