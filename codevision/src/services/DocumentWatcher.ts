import * as vscode from 'vscode';
import { AstParser } from '../parser/AstParser';
import { GraphBuilder } from '../graph-engine/GraphBuilder';
import { CodeVisionPanel } from '../webview/CodeVisionPanel';
import { StaticAnalyzer } from '../analyzer/StaticAnalyzer';
import { DebugService } from './DebugService';

export class DocumentWatcher implements vscode.Disposable {
  private _disposable: vscode.Disposable | undefined;
  private _debounceTimer: NodeJS.Timeout | undefined;
  private _parser: AstParser;
  private _graphBuilder: GraphBuilder;
  private _analyzer: StaticAnalyzer;
  private _debugService: DebugService;

  constructor() {
    this._parser = new AstParser();
    this._graphBuilder = new GraphBuilder();
    this._analyzer = new StaticAnalyzer();
    this._debugService = new DebugService();
  }

  public start() {
    if (!this._disposable) {
      this._disposable = vscode.workspace.onDidChangeTextDocument(this._onDocumentChanged, this);
      this._debugService.start();
      this.reprocess();
    }
  }

  public reprocess() {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      this._processDocument(activeEditor.document);
    }
  }

  private _onDocumentChanged(event: vscode.TextDocumentChangeEvent) {
    const document = event.document;

    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }

    this._debounceTimer = setTimeout(() => {
      this._processDocument(document);
    }, 500); // 500ms debounce
  }

  private _processDocument(document: vscode.TextDocument) {
    try {
      const code = document.getText();
      const fileName = document.fileName;
      const languageId = document.languageId;
      
      // Parse AST
      const astData = this._parser.parse(code, fileName, languageId);
      
      // Build Graph
      const graphData = this._graphBuilder.build(astData);

      // Run Static Analysis
      const analysisData = this._analyzer.analyze(code, fileName, languageId);
      
      // Debug popup
      vscode.window.showInformationMessage(`CodeVision: Parsed ${astData.entities.length} entities from ${languageId}`);

      // Send to Webview
      CodeVisionPanel.postMessage({
        type: 'updateGraph',
        payload: {
          graph: graphData,
          analysis: analysisData
        }
      });
    } catch (e) {
      console.error('Error processing document for CodeVision:', e);
    }
  }

  public dispose() {
    if (this._disposable) {
      this._disposable.dispose();
      this._disposable = undefined;
    }
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }
    this._debugService.dispose();
  }
}

