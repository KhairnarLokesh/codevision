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

  // Automatically start visualization when the user types/modifies a document
  const autoStartListener = vscode.workspace.onDidChangeTextDocument((event) => {
    // Only react to physical files (not output panels, debug consoles, etc.)
    if (event.document.uri.scheme === 'file') {
      if (!CodeVisionPanel.currentPanel) {
        CodeVisionPanel.render(context.extensionUri);
        documentWatcher.start();
      }
    }
  });

  context.subscriptions.push(startCommand, reprocessCommand, documentWatcher, autoStartListener);
}

export function deactivate() {}
