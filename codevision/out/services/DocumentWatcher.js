"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentWatcher = void 0;
const vscode = __importStar(require("vscode"));
const AstParser_1 = require("../parser/AstParser");
const GraphBuilder_1 = require("../graph-engine/GraphBuilder");
const CodeVisionPanel_1 = require("../webview/CodeVisionPanel");
const StaticAnalyzer_1 = require("../analyzer/StaticAnalyzer");
class DocumentWatcher {
    _disposable;
    _debounceTimer;
    _parser;
    _graphBuilder;
    _analyzer;
    constructor() {
        this._parser = new AstParser_1.AstParser();
        this._graphBuilder = new GraphBuilder_1.GraphBuilder();
        this._analyzer = new StaticAnalyzer_1.StaticAnalyzer();
    }
    start() {
        if (!this._disposable) {
            this._disposable = vscode.workspace.onDidChangeTextDocument(this._onDocumentChanged, this);
            this.reprocess();
        }
    }
    reprocess() {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            this._processDocument(activeEditor.document);
        }
    }
    _onDocumentChanged(event) {
        const document = event.document;
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
        }
        this._debounceTimer = setTimeout(() => {
            this._processDocument(document);
        }, 500); // 500ms debounce
    }
    _processDocument(document) {
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
            CodeVisionPanel_1.CodeVisionPanel.postMessage({
                type: 'updateGraph',
                payload: {
                    graph: graphData,
                    analysis: analysisData
                }
            });
        }
        catch (e) {
            console.error('Error processing document for CodeVision:', e);
        }
    }
    dispose() {
        if (this._disposable) {
            this._disposable.dispose();
            this._disposable = undefined;
        }
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
        }
    }
}
exports.DocumentWatcher = DocumentWatcher;
//# sourceMappingURL=DocumentWatcher.js.map