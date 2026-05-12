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
exports.AstParser = void 0;
const ts = __importStar(require("typescript"));
class AstParser {
    parse(code, fileName, languageId) {
        // Use precise TypeScript compiler API for JS/TS
        if (languageId === 'typescript' || languageId === 'javascript' || languageId === 'typescriptreact') {
            return this.parseTypeScript(code, fileName);
        }
        // Use universal regex parser for Python, Java, C++, Go, Rust, etc.
        return this.parseUniversal(code, languageId);
    }
    parseUniversal(code, languageId) {
        const nodes = [];
        const edges = [];
        let nodeIdCounter = 0;
        const lines = code.split('\n');
        let currentClassId;
        lines.forEach((line, index) => {
            const lineNumber = index + 1;
            // Basic Class Detection
            const classMatch = line.match(/(?:class|struct|interface)\s+([a-zA-Z0-9_]+)/);
            if (classMatch) {
                currentClassId = `class_${nodeIdCounter++}`;
                nodes.push({
                    id: currentClassId,
                    label: classMatch[1],
                    type: 'Class',
                    startLine: lineNumber,
                    endLine: lineNumber + 10 // Pseudo end line
                });
            }
            // Basic Function/Method Detection
            const funcMatch = line.match(/(?:def|fn|func|public|private|protected)\s+(?:[a-zA-Z0-9_<>]+\s+)?([a-zA-Z0-9_]+)\s*\(/);
            if (funcMatch && !line.includes('class ') && !line.includes('new ')) {
                const funcId = `func_${nodeIdCounter++}`;
                nodes.push({
                    id: funcId,
                    label: funcMatch[1],
                    type: 'Function',
                    startLine: lineNumber,
                    endLine: lineNumber + 5
                });
                if (currentClassId && line.startsWith(' ') || line.startsWith('\t')) {
                    edges.push({
                        id: `edge_${currentClassId}_${funcId}`,
                        source: currentClassId,
                        target: funcId,
                        label: 'contains'
                    });
                }
            }
            // Variable Detection (basic assignment)
            const varMatch = line.match(/(?:let|var|const|auto)\s+([a-zA-Z0-9_]+)\s*(?:=|:)/);
            if (varMatch) {
                const varId = `var_${nodeIdCounter++}`;
                nodes.push({
                    id: varId,
                    label: varMatch[1],
                    type: 'Variable',
                    startLine: lineNumber,
                    endLine: lineNumber
                });
            }
        });
        return { nodes, edges };
    }
    parseTypeScript(code, fileName) {
        const sourceFile = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true);
        const nodes = [];
        const edges = [];
        let nodeIdCounter = 0;
        function visit(node, parentId) {
            let currentId = parentId;
            if (ts.isFunctionDeclaration(node) && node.name) {
                currentId = `func_${nodeIdCounter++}`;
                const startPos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                const endPos = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
                nodes.push({
                    id: currentId,
                    label: node.name.text,
                    type: 'Function',
                    startLine: startPos.line + 1,
                    endLine: endPos.line + 1
                });
                if (parentId) {
                    edges.push({
                        id: `edge_${parentId}_${currentId}`,
                        source: parentId,
                        target: currentId,
                        label: 'contains'
                    });
                }
            }
            else if (ts.isClassDeclaration(node) && node.name) {
                currentId = `class_${nodeIdCounter++}`;
                const startPos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                const endPos = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
                nodes.push({
                    id: currentId,
                    label: node.name.text,
                    type: 'Class',
                    startLine: startPos.line + 1,
                    endLine: endPos.line + 1
                });
                if (parentId) {
                    edges.push({
                        id: `edge_${parentId}_${currentId}`,
                        source: parentId,
                        target: currentId,
                        label: 'contains'
                    });
                }
            }
            else if (ts.isVariableStatement(node)) {
                node.declarationList.declarations.forEach((decl) => {
                    if (ts.isIdentifier(decl.name)) {
                        const varId = `var_${nodeIdCounter++}`;
                        const startPos = sourceFile.getLineAndCharacterOfPosition(decl.getStart());
                        const endPos = sourceFile.getLineAndCharacterOfPosition(decl.getEnd());
                        nodes.push({
                            id: varId,
                            label: decl.name.text,
                            type: 'Variable',
                            startLine: startPos.line + 1,
                            endLine: endPos.line + 1
                        });
                        if (parentId) {
                            edges.push({
                                id: `edge_${parentId}_${varId}`,
                                source: parentId,
                                target: varId,
                                label: 'declares'
                            });
                        }
                    }
                });
            }
            ts.forEachChild(node, (child) => visit(child, currentId));
        }
        visit(sourceFile);
        return { nodes, edges };
    }
}
exports.AstParser = AstParser;
//# sourceMappingURL=AstParser.js.map