import * as vscode from 'vscode';
import { CodeVisionPanel } from './webview/CodeVisionPanel';
import { DocumentWatcher } from './services/DocumentWatcher';

export function activate(context: vscode.ExtensionContext) {
  console.log('CodeVision extension is now active!');

  const documentWatcher = new DocumentWatcher();

  const startCommand = vscode.commands.registerCommand('codevision.start', () => {
    CodeVisionPanel.render(context.extensionUri);
    documentWatcher.start();
  });

  const reprocessCommand = vscode.commands.registerCommand('codevision.reprocess', () => {
    documentWatcher.reprocess();
  });

  context.subscriptions.push(startCommand, reprocessCommand, documentWatcher);
}

export function deactivate() {}
