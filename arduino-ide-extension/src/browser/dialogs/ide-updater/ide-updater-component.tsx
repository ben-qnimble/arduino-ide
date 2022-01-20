import { nls } from '@theia/core/lib/common';
import {} from '@theia/core/shared/react';
import * as React from 'react';
import { ProgressInfo } from '../../../common/protocol/ide-updater-service';
import { UpdateInfo } from './ide-updater-dialog';

export type IDEUpdaterComponentProps = {
  updateInfo: UpdateInfo;
  downloadFinished: boolean;
  progress?: ProgressInfo;
  error?: Error;
  onInstall: () => void;
  onClose: () => void;
  onSkipVersion: () => void;
  onQuitAndInstall: () => void;
};

export const IDEUpdaterComponent = ({
  updateInfo: { version, changelog },
  downloadFinished,
  progress,
  error,
  onInstall,
  onClose,
  onSkipVersion,
  onQuitAndInstall,
}: IDEUpdaterComponentProps): React.ReactElement => {
  const [installationStarted, setInstallationStarted] = React.useState(false);

  const handleInstall = () => {
    setInstallationStarted(true);
    onInstall();
  };

  const closeButton = (
    <button onClick={onClose} type="button" className="theia-button secondary">
      {nls.localize('arduino/ide-updater/notNowButton', 'Not now')}
    </button>
  );

  return (
    <div className="ide-updater-dialog--content">
      <div className="ide-updater-dialog--logo-container">
        <div className="ide-updater-dialog--logo"></div>
      </div>
      <div className="ide-updater-dialog--new-version-text dialogSection">
        <div className="dialogRow">
          <div className="bold">
            {nls.localize(
              'arduino/ide-updater/updateAvailable',
              'Update Available'
            )}
          </div>
        </div>
        <div className="dialogRow">
          {nls.localize(
            'arduino/ide-updater/newVersionAvailable',
            'A new version of Arduino IDE ({0}) is available for download.',
            version
          )}
        </div>
        <div className="dialogRow">
          <textarea value={changelog} readOnly />
        </div>
        <div className="buttons-container">
          {installationStarted ? (
            <>
              {!!progress && (
                <div className="progress-container">
                  Progress: {progress.percent}%
                </div>
              )}
              {!!downloadFinished && (
                <>
                  {closeButton}
                  <button
                    onClick={onQuitAndInstall}
                    type="button"
                    className="theia-button quit-install"
                  >
                    {nls.localize(
                      'arduino/ide-updater/quitAndInstallButton',
                      'Quit and Install'
                    )}
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <button
                onClick={onSkipVersion}
                type="button"
                className="theia-button secondary skip-version"
              >
                {nls.localize(
                  'arduino/ide-updater/skipVersionButton',
                  'Skip version'
                )}
              </button>
              {closeButton}
              <button
                onClick={handleInstall}
                type="button"
                className="theia-button primary"
              >
                {nls.localize('arduino/ide-updater/installButton', 'Install')}
              </button>
            </>
          )}
        </div>
        {!!error && <div className="error-container">{error}</div>}
      </div>
    </div>
  );
};
