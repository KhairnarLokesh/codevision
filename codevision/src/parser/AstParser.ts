import * as ts from 'typescript';

export interface ParsedEntity {
  id: string;
  label: string;
  type: string;
  startLine: number;
  endLine: number;
  semanticRole?: string;
  metadata?: any;
}

export interface ParsedRelationship {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string; // 'DEPENDS_ON', 'HAS_LEFT', 'RENDERS'
  animated?: boolean;
}

export interface AstData {
  entities: ParsedEntity[];
  relationships: ParsedRelationship[];
  architecture?: any[];
  runtime?: any[];
  metadata?: {
    diagramType: string;
    confidence: number;
    recommendedLayout: string;
    maxVertices?: number;
  };
  patterns?: string[];
}

export interface ModelParser {
  parse(code: string, fileName: string, languageId: string, currentData: AstData): AstData;
}

import { ModelService } from './ModelService';
import { DataStructureParser } from './DataStructureParser';
import { ArchitectureParser } from './ArchitectureParser';
import { NeuralNetworkParser } from './NeuralNetworkParser';

export class AstParser {
  private modelService: ModelService;

  constructor() {
    this.modelService = new ModelService();
    this.modelService.register(new DataStructureParser());
    this.modelService.register(new ArchitectureParser());
    this.modelService.register(new NeuralNetworkParser());
  }

  public parse(code: string, fileName: string, languageId: string): AstData {
    let astData: AstData;
    if (languageId === 'typescript' || languageId === 'javascript' || languageId === 'typescriptreact') {
      astData = this.parseTypeScript(code, fileName);
    } else {
      astData = this.parseUniversal(code, languageId);
    }
    
    this.extractDataFlow(code, astData);
    
    // Delegate complex analysis to ModelService
    astData = this.modelService.analyze(code, fileName, languageId, astData);
    
    // Final pass: ensure all entities have parent links where applicable
    astData.entities.forEach(entity => {
      if (entity.startLine > 0 && !astData.relationships.find(r => r.target === entity.id && r.type === 'CONTAINS')) {
        this.linkToParent(entity.startLine, entity, astData);
      }
    });

    return astData;
  }


  private extractDataFlow(code: string, astData: AstData) {
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // 1. Array Literal Match: int[] numbers = {10, 20};
      const arrayLiteralMatch = line.match(/(?:[a-zA-Z0-9_<>]+)\[\]\s+([a-zA-Z0-9_]+)\s*=\s*\{([^}]+)\}/);
      if (arrayLiteralMatch) {
        const arrayName = arrayLiteralMatch[1];
        const elementsStr = arrayLiteralMatch[2];
        const elements = elementsStr.split(',').map(e => e.trim().replace(/"/g, ''));

        let arrayNode = astData.entities.find(n => n.id === `arr_${arrayName}`);
        if (!arrayNode) {
          arrayNode = { 
            id: `arr_${arrayName}`, 
            label: `${arrayName}[${elements.length}]`, 
            type: 'Array Memory', 
            startLine: lineNumber, 
            endLine: lineNumber, 
            semanticRole: 'collection',
            metadata: { elements }
          };
          astData.entities.push(arrayNode);
          this.linkToParent(lineNumber, arrayNode, astData);
        }
        return;
      }

      // 2. Array instantiation with new: int[] newArray = new int[size];
      const arrayNewMatch = line.match(/(?:[a-zA-Z0-9_<>]+)\[\]\s+([a-zA-Z0-9_]+)\s*=\s*new\s+[a-zA-Z0-9_]+\s*\[([^\]]+)\]/);
      if (arrayNewMatch) {
        const arrayName = arrayNewMatch[1];
        const sizeExpr = arrayNewMatch[2];

        let arrayNode = astData.entities.find(n => n.id === `arr_${arrayName}`);
        if (!arrayNode) {
          arrayNode = { 
            id: `arr_${arrayName}`, 
            label: `${arrayName}[]`, 
            type: 'Array Memory', 
            startLine: lineNumber, 
            endLine: lineNumber, 
            semanticRole: 'collection',
            metadata: { elements: [], sizeExpr }
          };
          astData.entities.push(arrayNode);
          this.linkToParent(lineNumber, arrayNode, astData);
        }
        return;
      }

      // 3. Generic Instantiation: Stack s = new Stack();
      const genericInstMatch = line.match(/(?:[a-zA-Z0-9_<>\[\]]+\s+)?([a-zA-Z0-9_]+)\s*=\s*new\s+([A-Z][a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
      if (genericInstMatch && !line.includes('.')) {
        const varName = genericInstMatch[1];
        const className = genericInstMatch[2];
        const args = genericInstMatch[3];
        const label = args ? args.replace(/"/g, '') : varName;

        let type = 'Object';
        if (className.includes('Stack')) type = 'Stack Memory';
        else if (className.includes('Queue') || className.includes('LinkedList')) type = 'Queue Memory';
        else if (className.includes('Graph')) type = 'Graph Node';
        else if (className.includes('Node') || className.includes('Tree')) type = 'Tree Node';

        let instNode = astData.entities.find(n => n.id === `inst_${varName}`);
        if (!instNode) {
          instNode = { 
            id: `inst_${varName}`, 
            label: label, 
            type: type, 
            startLine: lineNumber, 
            endLine: lineNumber, 
            semanticRole: 'collection',
            metadata: { elements: [], operations: [] }
          };
          astData.entities.push(instNode);
          this.linkToParent(lineNumber, instNode, astData);
        }
        return;
      }

      // 4. Pointer Assignments: root.left = node
      const pointerMatch = line.match(/([a-zA-Z0-9_\.]+)\.(next|prev|left|right|child|parent)\s*=\s*([a-zA-Z0-9_]+)\s*;/);
      if (pointerMatch) {
         const sourcePath = pointerMatch[1];
         const propName = pointerMatch[2];
         const targetName = pointerMatch[3];

         const sourceId = `inst_${sourcePath.replace(/\./g, '_')}`;
         const targetId = `inst_${targetName}`;

         if (!astData.entities.find(n => n.id === sourceId)) {
            astData.entities.push({ id: sourceId, label: sourcePath, type: 'Tree Node', startLine: lineNumber, endLine: lineNumber, semanticRole: 'pointer', metadata: { elements: [] } });
         }
         if (!astData.entities.find(n => n.id === targetId)) {
            astData.entities.push({ id: targetId, label: targetName, type: 'Tree Node', startLine: lineNumber, endLine: lineNumber, semanticRole: 'pointer', metadata: { elements: [] } });
         }

         astData.relationships.push({
           id: `rel_${sourceId}_${targetId}_${lineNumber}`,
           source: sourceId,
           target: targetId,
           label: propName,
           type: `HAS_${propName.toUpperCase()}`,
           animated: true
         });
         return;
      }

      // 5. Operations: s.push(10), q.add(20), arr[i] = 30
      // Array assignment
      const arrayAssignMatch = line.match(/([a-zA-Z0-9_]+)\[([^\]]+)\]\s*=\s*([^;]+);/);
      if (arrayAssignMatch) {
        const arrayName = arrayAssignMatch[1];
        const value = arrayAssignMatch[3].trim().replace(/"/g, '');
        let arrayNode = astData.entities.find(n => n.id === `arr_${arrayName}`);
        if (arrayNode) {
          if (!arrayNode.metadata.elements.includes(value)) {
            arrayNode.metadata.elements.push(value);
            arrayNode.label = `${arrayName}[${arrayNode.metadata.elements.length}]`;
          }
        }
        return;
      }

      // Method calls
      const methodMatch = line.match(/([a-zA-Z0-9_]+)\.(push|pop|add|offer|enqueue|dequeue|poll|peek|top|front|addEdge|add_edge)\s*\(([^)]*)\)/);
      if (methodMatch) {
        const objName = methodMatch[1];
        const op = methodMatch[2];
        const args = methodMatch[3].replace(/"/g, '').split(',').map(a => a.trim());

        let node = astData.entities.find(n => n.id === `inst_${objName}`);
        if (node) {
          if (!node.metadata.elements) node.metadata.elements = [];
          
          if (['push', 'add', 'offer', 'enqueue'].includes(op)) {
            node.metadata.elements.push(args[0]);
          } else if (['pop', 'poll', 'dequeue'].includes(op)) {
            op === 'pop' ? node.metadata.elements.pop() : node.metadata.elements.shift();
          } else if (op === 'addEdge' || op === 'add_edge') {
            // Handle graph edges
            const sourceVal = args[0];
            const targetVal = args[1];
            const sourceId = `graph_${objName}_node_${sourceVal}`;
            const targetId = `graph_${objName}_node_${targetVal}`;
            
            if (!astData.entities.find(n => n.id === sourceId)) {
              astData.entities.push({ id: sourceId, label: sourceVal, type: 'Graph Node', startLine: lineNumber, endLine: lineNumber, semanticRole: 'vertex', metadata: { elements: [] } });
            }
            if (!astData.entities.find(n => n.id === targetId)) {
              astData.entities.push({ id: targetId, label: targetVal, type: 'Graph Node', startLine: lineNumber, endLine: lineNumber, semanticRole: 'vertex', metadata: { elements: [] } });
            }
            astData.relationships.push({ id: `edge_${sourceId}_${targetId}_${lineNumber}`, source: sourceId, target: targetId, label: '', type: 'HAS_EDGE' });
          }
        }
        return;
      }
    });
  }

  private linkToParent(lineNumber: number, node: ParsedEntity, astData: AstData) {
    let parentNode = astData.entities.find(e => e.type === 'Function' && lineNumber >= e.startLine && lineNumber <= e.endLine);
    if (!parentNode) {
      parentNode = astData.entities.find(e => e.type === 'Class' && lineNumber >= e.startLine && lineNumber <= e.endLine);
    }
    if (parentNode) {
      astData.relationships.push({
        id: `edge_${parentNode.id}_${node.id}`,
        source: parentNode.id,
        target: node.id,
        label: 'declares',
        type: 'CONTAINS'
      });
    }
  }

  private parseUniversal(code: string, languageId: string): AstData {
    const entities: ParsedEntity[] = [];
    const relationships: ParsedRelationship[] = [];
    let nodeIdCounter = 0;

    const lines = code.split('\n');
    let currentClassId: string | undefined;

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      const classMatch = line.match(/(?:class|struct|interface|namespace)\s+([a-zA-Z0-9_]+)/);
      if (classMatch) {
        currentClassId = `class_${nodeIdCounter++}`;
        entities.push({
          id: currentClassId,
          label: classMatch[1],
          type: 'Class',
          startLine: lineNumber,
          endLine: lineNumber + 10,
          semanticRole: 'blueprint'
        });
      }

      // C++ Style: void Graph::addEdge or function name
      const funcMatch = line.match(/(?:def|fn|func|public|private|protected|void|int|auto|virtual)\s+(?:(?:static|final|async|override)\s+)*(?:[a-zA-Z0-9_<>[\]:]+\s+)?([a-zA-Z0-9_]+)\s*\(/);
      if (funcMatch && !line.includes('class ') && !line.includes('new ') && !line.includes('delete ')) {
        const funcId = `func_${nodeIdCounter++}`;
        entities.push({
          id: funcId,
          label: funcMatch[1],
          type: 'Function',
          startLine: lineNumber,
          endLine: lineNumber + 5,
          semanticRole: 'execution_block'
        });

        if (currentClassId && (line.startsWith(' ') || line.startsWith('\t'))) {
          relationships.push({
            id: `edge_${currentClassId}_${funcId}`,
            source: currentClassId as string,
            target: funcId,
            label: 'contains',
            type: 'CONTAINS'
          });
        }
      }
    });

    return { entities, relationships };
  }

  private parseTypeScript(code: string, fileName: string): AstData {
    const sourceFile = ts.createSourceFile(
      fileName,
      code,
      ts.ScriptTarget.Latest,
      true
    );

    const entities: ParsedEntity[] = [];
    const relationships: ParsedRelationship[] = [];

    let nodeIdCounter = 0;

    function visit(node: ts.Node, parentId?: string) {
      let currentId = parentId;

      if (ts.isFunctionDeclaration(node) && node.name) {
        currentId = `func_${nodeIdCounter++}`;
        const startPos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const endPos = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
        
        entities.push({
          id: currentId,
          label: node.name.text,
          type: 'Function',
          startLine: startPos.line + 1,
          endLine: endPos.line + 1,
          semanticRole: 'execution_block'
        });

        if (parentId) {
          relationships.push({
            id: `edge_${parentId}_${currentId}`,
            source: parentId,
            target: currentId,
            label: 'contains',
            type: 'CONTAINS'
          });
        }
      } else if (ts.isClassDeclaration(node) && node.name) {
        currentId = `class_${nodeIdCounter++}`;
        const startPos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const endPos = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
        
        entities.push({
          id: currentId,
          label: node.name.text,
          type: 'Class',
          startLine: startPos.line + 1,
          endLine: endPos.line + 1,
          semanticRole: 'blueprint'
        });

        if (parentId) {
          relationships.push({
            id: `edge_${parentId}_${currentId}`,
            source: parentId,
            target: currentId,
            label: 'contains',
            type: 'CONTAINS'
          });
        }
      }

      ts.forEachChild(node, (child: any) => visit(child, currentId));
    }

    visit(sourceFile);

    return { entities, relationships };
  }
}
