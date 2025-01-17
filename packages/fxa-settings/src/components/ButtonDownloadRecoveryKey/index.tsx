/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { useAccount, useFtlMsgResolver } from '../../models';
import { FtlMsg } from 'fxa-react/lib/utils';
import { logViewEvent } from '../../lib/metrics';

interface ButtonDownloadRecoveryKeyProps {
  recoveryKeyValue: string;
  viewName: string;
}

export const ButtonDownloadRecoveryKey = ({
  recoveryKeyValue,
  viewName,
}: ButtonDownloadRecoveryKeyProps) => {
  // TODO: format by locale
  const { primaryEmail } = useAccount();
  const currentDate = new Date();
  const downloadDateInLocale = currentDate.toLocaleDateString(
    navigator.language
  );
  const ftlMsgResolver = useFtlMsgResolver();

  const fileHeading = ftlMsgResolver.getMsg(
    'recovery-key-file-header',
    'SAVE YOUR ACCOUNT RECOVERY KEY'
  );

  const fileInstructions = ftlMsgResolver.getMsg(
    'recovery-key-file-instructions',
    'Store this file containing your account recovery key in a place you’ll remember. Or print it and keep a physical copy. Your account recovery key can help you recover Firefox data if you forget your password.'
  );

  const fileKey = ftlMsgResolver.getMsg(
    'recovery-key-file-key-value',
    `🔑 Key:  ${recoveryKeyValue}`,
    { recoveryKeyValue }
  );

  const fileUserEmail = ftlMsgResolver.getMsg(
    'recovery-key-file-user-email',
    `➤ Firefox account: ${primaryEmail.email}`,
    { email: primaryEmail.email }
  );

  const fileDate = ftlMsgResolver.getMsg(
    'recovery-key-file-download-date',
    `➤ Key generated: ${downloadDateInLocale}`,
    { downloadDate: downloadDateInLocale }
  );

  const supportURL = 'https://mzl.la/3bNrM1I';

  const fileSupport = ftlMsgResolver.getMsg(
    'recovery-key-file-support',
    `➤ Learn more about your account recovery key: ${supportURL}`,
    { supportURL }
  );

  const fileContent = new Blob(
    [
      fileHeading,
      '\r\n\r\n',
      fileInstructions,
      '\r\n\r\n',
      fileKey,
      '\r\n\r\n',
      fileUserEmail,
      '\r\n',
      fileDate,
      '\r\n',
      fileSupport,
    ],
    {
      type: 'text/plain',
    }
  );

  const getFilename = () => {
    const date = currentDate.toISOString().split('T')[0];
    // Windows has a max directory length of 260 characters (including path)
    // filename should be kept much shorter (maxLength is arbitrary).
    const maxLength = 70;
    const prefix = 'Firefox-Recovery-Key';
    let email = primaryEmail.email;
    let filename = `${prefix}_${date}_${email}`;

    if (filename.length > maxLength) {
      const lengthWithoutEmail = filename.length - email.length;
      email = email.slice(0, maxLength - lengthWithoutEmail);
      filename = `${prefix}_${date}_${email}`;
    }
    return filename;
  };

  const onClickLogMetrics = () => {
    logViewEvent(`flow.${viewName}`, `recovery-key.download-option`);
  };

  return (
    <FtlMsg id="recovery-key-download-button" attrs={{ title: true }}>
      <a
        title="Download"
        href={URL.createObjectURL(fileContent)}
        download={getFilename()}
        data-testid="recovery-key-download"
        className="cta-primary cta-xl w-full"
        onClick={onClickLogMetrics}
      >
        Download your recovery key
      </a>
    </FtlMsg>
  );
};

export default ButtonDownloadRecoveryKey;
