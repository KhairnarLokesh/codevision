import * as vscode from 'vscode';

export class CodeVisionPanel {
  public static currentPanel: CodeVisionPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
    this._setWebviewMessageListener(this._panel.webview);
  }

  public static render(extensionUri: vscode.Uri) {
    if (CodeVisionPanel.currentPanel) {
      CodeVisionPanel.currentPanel._panel.reveal(vscode.ViewColumn.Two);
    } else {
      const panel = vscode.window.createWebviewPanel(
        'codeVision',
        'CodeVision Dashboard',
        vscode.ViewColumn.Two,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'webview-ui', 'build')],
        }
      );
      CodeVisionPanel.currentPanel = new CodeVisionPanel(panel, extensionUri);
    }
  }

  public static postMessage(message: any) {
    if (CodeVisionPanel.currentPanel) {
      CodeVisionPanel.currentPanel._panel.webview.postMessage(message);
    }
  }

  public dispose() {
    CodeVisionPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
    // In production, point to the built index.js and index.css
    // For dev, if you run the Vite server, you could point to localhost
    // We will assume Vite builds into webview-ui/build/assets
    
    // As per vite.config.ts, assets are inside `assets/` folder
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'webview-ui', 'build', 'assets', 'index.js'));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'webview-ui', 'build', 'assets', 'index.css'));
    const nonce = getNonce();

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" type="text/css" href="${styleUri}">
          <title>CodeVision Dashboard</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }

  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command;
        const text = message.text;
        switch (command) {
          case 'hello':
            vscode.window.showInformationMessage(text);
            return;
          case 'ready':
            vscode.commands.executeCommand('codevision.reprocess');
            return;
        }
      },
      undefined,
      this._disposables
    );
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
