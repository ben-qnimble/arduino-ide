import * as React from 'react';
import { inject, injectable } from 'inversify';
import { DialogProps } from '@theia/core/lib/browser/dialogs';
import { AbstractDialog } from '../../theia/dialogs/dialogs';
import { Widget } from '@phosphor/widgets';
import { Message } from '@phosphor/messaging';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { Command, CommandRegistry, nls } from '@theia/core';
import { Contribution } from '../../contributions/contribution';
import { IDEUpdaterComponent } from './ide-updater-component';
import { IDEUpdaterCommands } from '../../ide-updater/ide-updater-commands';
import {
  IDEUpdaterServiceClient,
  ProgressInfo,
} from '../../../common/protocol/ide-updater-service';

@injectable()
export class IDEUpdaterDialogWidget extends ReactWidget {
  protected isOpen = new Object();
  updateInfo: UpdateInfo;
  progressInfo: ProgressInfo | undefined;
  error: Error | undefined;
  downloadFinished: boolean;

  @inject(IDEUpdaterCommands)
  protected readonly updater: IDEUpdaterCommands;

  @inject(IDEUpdaterServiceClient)
  protected readonly updaterClient: IDEUpdaterServiceClient;

  public busyCallback = (busy: boolean) => {};

  init(updateInfo: UpdateInfo): void {
    this.updateInfo = updateInfo;
    this.progressInfo = undefined;
    this.error = undefined;
    this.downloadFinished = false;

    this.updaterClient.onError((e) => {
      this.error = e;
      this.busyCallback(false);
      this.update();
    });
    this.updaterClient.onDownloadProgressChanged((e) => {
      this.progressInfo = e;
      this.update();
      console.log('onDownloadProgressChanged', e);
    });
    this.updaterClient.onDownloadFinished((e) => {
      this.downloadFinished = true;
      this.busyCallback(false);
      this.update();
      console.log('onDownloadFinished', e);
    });
  }

  onCloseRequest(msg: Message): void {
    super.onCloseRequest(msg);
    this.isOpen = new Object();
  }

  onSkipVersion(): void {
    this.onCloseRequest(new Message('Skipping version'));
  }

  onClose(): void {
    this.onCloseRequest(new Message('Closing'));
  }

  async onInstall(): Promise<void> {
    this.progressInfo = undefined;
    this.error = undefined;
    this.busyCallback(true);
    this.updater.downloadUpdate();
  }

  onQuitAndInstall(): void {
    this.updater.quitAndInstall();
  }

  protected render(): React.ReactNode {
    return !!this.updateInfo ? (
      <form>
        <IDEUpdaterComponent
          updateInfo={this.updateInfo}
          downloadFinished={this.downloadFinished}
          progress={this.progressInfo}
          onClose={this.onClose.bind(this)}
          onSkipVersion={this.onSkipVersion.bind(this)}
          onInstall={this.onInstall.bind(this)}
          onQuitAndInstall={this.onQuitAndInstall.bind(this)}
        />
      </form>
    ) : null;
  }
}

@injectable()
export class IDEUpdaterDialogProps extends DialogProps {}

export type UpdateInfo = {
  version: string;
  changelog: any;
};

@injectable()
export class IDEUpdaterDialog extends AbstractDialog<UpdateInfo> {
  @inject(IDEUpdaterDialogWidget)
  protected readonly widget: IDEUpdaterDialogWidget;

  private busy = false;

  constructor(
    @inject(IDEUpdaterDialogProps)
    protected readonly props: IDEUpdaterDialogProps
  ) {
    super({
      title: nls.localize(
        'arduino/updater/ideUpdaterDialog',
        'Software Update'
      ),
    });
    this.contentNode.classList.add('ide-updater-dialog');
    this.acceptButton = undefined;
  }

  get value(): UpdateInfo {
    return this.widget.updateInfo;
  }

  protected onAfterAttach(msg: Message): void {
    if (this.widget.isAttached) {
      Widget.detach(this.widget);
    }
    Widget.attach(this.widget, this.contentNode);
    this.widget.busyCallback = this.busyCallback.bind(this);
    super.onAfterAttach(msg);
    this.update();
  }

  async open(
    data: UpdateInfo | undefined = undefined
  ): Promise<UpdateInfo | undefined> {
    if (data && data.version && data.changelog) {
      this.widget.init(data);
      return super.open();
    }
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.widget.update();
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.widget.activate();
  }

  protected handleEnter(event: KeyboardEvent): boolean | void {
    return false;
  }

  close(): void {
    if (this.busy) {
      return;
    }
    this.widget.close();
    super.close();
  }

  busyCallback(busy: boolean): void {
    this.busy = busy;
    if (busy) {
      this.closeCrossNode.classList.add('disabled');
    } else {
      this.closeCrossNode.classList.remove('disabled');
    }
  }
}

@injectable()
export class IDEUpdater extends Contribution {
  @inject(IDEUpdaterDialog)
  protected readonly dialog: IDEUpdaterDialog;

  protected dialogOpened = false;

  registerCommands(registry: CommandRegistry): void {
    registry.registerCommand(IDEUpdater.Commands.OPEN, {
      execute: async () => {
        try {
          this.dialogOpened = true;
          await this.dialog.open();
        } finally {
          this.dialogOpened = false;
        }
      },
      isEnabled: () => !this.dialogOpened,
    });
  }
}

export namespace IDEUpdater {
  export namespace Commands {
    export const OPEN: Command = {
      id: 'arduino-ide-updater-open',
      label: nls.localize(
        'arduino/updater/ideUpdaterDialogOpen',
        'Open Software Update dialog'
      ),
      category: 'Arduino',
    };
  }
}
