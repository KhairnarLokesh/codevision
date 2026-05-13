import * as vscode from 'vscode';
import { CodeVisionPanel } from '../webview/CodeVisionPanel';

export class DebugService implements vscode.Disposable {
    private _disposable: vscode.Disposable | undefined;

    public start() {
        if (!this._disposable) {
            this._disposable = vscode.debug.onDidChangeActiveStackItem(this._onDebugStateChanged, this);
            console.log('CodeVision DebugService started');
        }
    }

    private async _onDebugStateChanged(e: vscode.DebugSessionChangeEvent | undefined) {
        const session = vscode.debug.activeDebugSession;
        if (!session) return;

        // Note: we might want to use session.activeStackItem but it's often undefined if not stepping
        // The event gives us context
        const stackItem = vscode.debug.activeStackItem;
        if (stackItem instanceof vscode.DebugStackFrame) {
            const line = stackItem.range.start.line + 1; // 1-indexed
            const fileName = stackItem.source?.path;

            if (line && fileName) {
                CodeVisionPanel.postMessage({
                    type: 'highlightNode',
                    payload: {
                        line,
                        fileName
                    }
                });
            }
        }
    }

    public stop() {
        if (this._disposable) {
            this._disposable.dispose();
            this._disposable = undefined;
        }
    }

    public dispose() {
        this.stop();
    }
}
