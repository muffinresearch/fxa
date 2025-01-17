/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { fireEvent, render, screen } from '@testing-library/react';
// import { getFtlBundle, testAllL10n } from 'fxa-react/lib/test-utils';
// import { FluentBundle } from '@fluent/bundle';
import { usePageViewEvent, logViewEvent } from '../../../lib/metrics';
import { viewName } from '.';
import { Subject } from './mocks';
import { REACT_ENTRYPOINT } from '../../../constants';
import { Account } from '../../../models';
import { getSearchWithParams, typeByLabelText } from '../../../lib/test-utils';
import { AuthUiErrors } from '../../../lib/auth-errors/auth-errors';
import { act } from 'react-dom/test-utils';

jest.mock('../../../lib/metrics', () => ({
  usePageViewEvent: jest.fn(),
  logViewEvent: jest.fn(),
}));

type ParamValue = string | null;

let account: Account;
let mockToken: ParamValue,
  mockCode: ParamValue,
  mockEmail: ParamValue,
  mockUid: ParamValue;
const mockNavigate = jest.fn();

const mockLocation = () => {
  const search = getSearchWithParams({
    mockToken,
    mockCode,
    mockEmail,
    mockUid,
  });
  return {
    href: `http://localhost.com/${search}`,
    search,
  };
};

jest.mock('@reach/router', () => ({
  ...jest.requireActual('@reach/router'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation(),
}));

describe('PageAccountRecoveryConfirmKey', () => {
  // TODO: enable l10n tests when they've been updated to handle embedded tags in ftl strings
  // TODO: in FXA-6461
  // let bundle: FluentBundle;
  // beforeAll(async () => {
  //   bundle = await getFtlBundle('settings');
  // });

  beforeEach(() => {
    mockCode = 'code';
    mockToken = 'token';
    mockEmail = 'boo@boo.boo';
    mockUid = 'uid';

    account = {
      getRecoveryKeyBundle: jest.fn().mockResolvedValue({
        recoveryData: 'mockRecoveryData',
        recoveryKeyId: 'mockRecoveryKeyId',
      }),
      verifyPasswordForgotToken: jest
        .fn()
        .mockResolvedValue({ accountResetToken: 'mockResetToken' }),
    } as unknown as Account;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders as expected when the link is valid', () => {
    render(<Subject {...{ account }} />);
    // testAllL10n(screen, bundle);

    const headingEl = screen.getByRole('heading', { level: 1 });
    expect(headingEl).toHaveTextContent(
      'Reset password with account recovery key to continue to account settings'
    );
    screen.getByText(
      'Please enter the one time use account recovery key you stored in a safe place to regain access to your Firefox Account.'
    );
    screen.getByTestId('warning-message-container');
    screen.getByLabelText('Enter account recovery key');
    screen.getByRole('button', { name: 'Confirm account recovery key' });
    screen.getByRole('link', {
      name: "Don't have an account recovery key?",
    });
  });

  it('renders the component as expected when provided with an expired link', async () => {
    const accountWithTokenError = {
      verifyPasswordForgotToken: jest.fn().mockImplementation(() => {
        throw AuthUiErrors.INVALID_TOKEN;
      }),
    } as unknown as Account;
    render(<Subject {...{ account: accountWithTokenError }} />);

    await typeByLabelText('Enter account recovery key')('zzz');
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm account recovery key' })
    );

    await screen.findByRole('heading', {
      name: 'Reset password link expired',
    });
    screen.getByText('The link you clicked to reset your password is expired.');
    screen.getByRole('button', {
      name: 'Receive new link',
    });
  });

  describe('renders the component as expected when provided with a damaged link', () => {
    it('with missing token', async () => {
      mockToken = null;
      render(<Subject {...{ account }} />);

      await screen.findByRole('heading', {
        name: 'Reset password link damaged',
      });
      screen.getByText(
        'The link you clicked was missing characters, and may have been broken by your email client. Copy the address carefully, and try again.'
      );
    });
    it('with missing code', async () => {
      mockCode = null;
      render(<Subject {...{ account }} />);

      await screen.findByRole('heading', {
        name: 'Reset password link damaged',
      });
    });
    it('with missing email', async () => {
      mockEmail = null;
      render(<Subject {...{ account }} />);

      await screen.findByRole('heading', {
        name: 'Reset password link damaged',
      });
    });
    it('with missing uid', async () => {
      mockUid = null;
      render(<Subject {...{ account }} />);

      await screen.findByRole('heading', {
        name: 'Reset password link damaged',
      });
    });
  });

  describe('emits metrics events', () => {
    it('on engage, submit, success', async () => {
      render(<Subject {...{ account }} />);
      expect(usePageViewEvent).toHaveBeenCalledWith(viewName, REACT_ENTRYPOINT);

      await act(async () => {
        await typeByLabelText('Enter account recovery key')('zzz');
      });

      expect(logViewEvent).toHaveBeenCalledWith(
        'flow',
        `${viewName}.engage`,
        REACT_ENTRYPOINT
      );

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: 'Confirm account recovery key' })
        );
      });

      expect(logViewEvent).toHaveBeenCalledWith(
        'flow',
        `${viewName}.submit`,
        REACT_ENTRYPOINT
      );

      expect(logViewEvent).toHaveBeenCalledWith(
        'flow',
        `${viewName}.success`,
        REACT_ENTRYPOINT
      );
    });

    it('on error and lost recovery key click', async () => {
      const accountWithInvalidRecoveryKey = {
        ...account,
        getRecoveryKeyBundle: jest.fn().mockImplementation(() => {
          throw new Error('boop');
        }),
      } as unknown as Account;
      render(<Subject {...{ account: accountWithInvalidRecoveryKey }} />);

      await typeByLabelText('Enter account recovery key')('zzz');
      fireEvent.click(
        screen.getByRole('button', { name: 'Confirm account recovery key' })
      );

      await screen.findByText('Invalid account recovery key');
      expect(logViewEvent).toHaveBeenCalledWith(
        'flow',
        `${viewName}.fail`,
        REACT_ENTRYPOINT
      );

      await act(async () => {
        fireEvent.click(
          screen.getByRole('link', {
            name: "Don't have an account recovery key?",
          })
        );
      });

      expect(logViewEvent).toHaveBeenCalledWith(
        'flow',
        `lost-recovery-key.${viewName}`,
        REACT_ENTRYPOINT
      );
    });
  });
});
