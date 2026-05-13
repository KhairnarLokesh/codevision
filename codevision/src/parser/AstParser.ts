import * as ts from 'typescript';

export interface ParsedEntity {
  id: string;
  label: string;
  type: string;
  startLine: number;
  endLine: number;
  semanticRole?: string;
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
  };
  patterns?: string[];
}

export class AstParser {
  public parse(code: string, fileName: string, languageId: string): AstData {
    let astData: AstData;
    if (languageId === 'typescript' || languageId === 'javascript' || languageId === 'typescriptreact') {
      astData = this.parseTypeScript(code, fileName);
    } else {
      astData = this.parseUniversal(code, languageId);
    }
    
    this.extractDataFlow(code, astData);
    this.analyzeSemantics(code, astData);
    
    return astData;
  }

  private analyzeSemantics(code: string, astData: AstData): void {
    astData.metadata = { diagramType: 'GENERIC', confidence: 0.1, recommendedLayout: 'GRID' };
    astData.patterns = [];

    const lines = code.split('\n');

    let hasLeftRight = false;
    let hasNext = false;
    let hasRecursiveClass = false;
    let hasChildren = code.includes('.children') || code.includes('.child');
    let hasAdj = code.includes('adj') || code.includes('addEdge') || code.includes('graph');
    let hasExpress = code.includes('express()') || code.includes('app.get');
    let hasReact = code.includes('import React') || code.includes('useState(') || code.includes('Component');
    let classDeclarations = 0;
    let dbEntities = 0;

    lines.forEach(line => {
      if (line.match(/class\s+[A-Za-z0-9_]+/)) classDeclarations++;
      if (line.match(/[A-Za-z0-9_]+\s+(left|right)\b/)) hasLeftRight = true;
      if (line.match(/[A-Za-z0-9_]+\s+(next)\b/)) hasNext = true;
      if (line.match(/([A-Z][A-Za-z0-9_]*)\s+[a-z_][a-zA-Z0-9_]*\s*;/)) hasRecursiveClass = true; 
      if (line.includes('Model') || line.includes('@Entity') || line.includes('@Table')) dbEntities++;
    });

    if (dbEntities > 0) {
      astData.metadata = { diagramType: 'DATABASE_SCHEMA', confidence: 0.90, recommendedLayout: 'ER_DIAGRAM' };
      astData.patterns.push('db_model', 'entity_relationships');
    } else if (hasLeftRight && hasRecursiveClass) {
      astData.metadata = { diagramType: 'BINARY_TREE', confidence: 0.95, recommendedLayout: 'TB' };
      astData.patterns.push('recursive_class', 'left_right_pointers');
    } else if (hasNext && hasRecursiveClass) {
      astData.metadata = { diagramType: 'LINKED_LIST', confidence: 0.92, recommendedLayout: 'LR' };
      astData.patterns.push('recursive_class', 'next_pointer');
    } else if (hasAdj) {
      astData.metadata = { diagramType: 'GRAPH', confidence: 0.88, recommendedLayout: 'TB' };
      astData.patterns.push('adjacency_list', 'graph_edges');
    } else if (hasChildren) {
      astData.metadata = { diagramType: 'TREE', confidence: 0.85, recommendedLayout: 'TB' };
      astData.patterns.push('children_array', 'hierarchy');
    } else if (hasExpress) {
      astData.metadata = { diagramType: 'BACKEND_API', confidence: 0.85, recommendedLayout: 'LAYERED' };
      astData.patterns.push('routing', 'api_endpoints');
    } else if (hasReact) {
      astData.metadata = { diagramType: 'FRONTEND_COMPONENT_TREE', confidence: 0.85, recommendedLayout: 'TB' };
      astData.patterns.push('react_components', 'jsx');
    } else if (classDeclarations > 1) {
      astData.metadata = { diagramType: 'OOP_ARCHITECTURE', confidence: 0.7, recommendedLayout: 'TB' };
      astData.patterns.push('multiple_classes');
    }
  }

  private extractDataFlow(code: string, astData: AstData) {
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      const instMatch = line.match(/(?:[a-zA-Z0-9_<>\[\]]+\s+)?([a-zA-Z0-9_]+)\s*=\s*(?:new\s+)?([A-Z][a-zA-Z0-9_]+)\s*\(/);
      if (instMatch) {
        const varName = instMatch[1];
        const className = instMatch[2];

        let instNode = astData.entities.find(n => n.label === varName);
        if (!instNode) {
          instNode = { id: `inst_${varName}_${lineNumber}`, label: `${varName}: ${className}`, type: 'Instance', startLine: lineNumber, endLine: lineNumber, semanticRole: 'instantiation' };
          astData.entities.push(instNode);
        } else {
          instNode.label = `${varName}: ${className}`;
          instNode.type = 'Instance';
        }
      }

      const dsMatch = line.match(/([a-zA-Z0-9_]+)\.(next|prev|left|right|child|parent)\s*=\s*([a-zA-Z0-9_]+)/);
      const pushMatch = line.match(/([a-zA-Z0-9_]+)\.children\.push\s*\(\s*([a-zA-Z0-9_]+)\s*\)/);
      const adjPushMatch = line.match(/([a-zA-Z0-9_]+)\[([a-zA-Z0-9_]+)\]\.push\s*\(\s*([a-zA-Z0-9_]+)\s*\)/);
      const addEdgeMatch = line.match(/([a-zA-Z0-9_]+)\.addEdge\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)/);

      if (dsMatch || pushMatch || adjPushMatch || addEdgeMatch) {
        let sourceName = '';
        let targetName = '';
        let propName = 'edge';

        if (dsMatch) {
          sourceName = dsMatch[1];
          propName = dsMatch[2];
          targetName = dsMatch[3];
        } else if (pushMatch) {
          sourceName = pushMatch[1];
          propName = 'child';
          targetName = pushMatch[2];
        } else if (adjPushMatch) {
          sourceName = adjPushMatch[2]; // From u
          propName = 'to';
          targetName = adjPushMatch[3]; // To v
        } else if (addEdgeMatch) {
          sourceName = addEdgeMatch[2];
          propName = 'edge';
          targetName = addEdgeMatch[3];
        }

        let sourceNode = astData.entities.find(n => n.label === sourceName || n.label.startsWith(sourceName + ':'));
        if (!sourceNode) {
          sourceNode = { id: `inst_${sourceName}_${lineNumber}`, label: sourceName, type: 'Instance', startLine: lineNumber, endLine: lineNumber, semanticRole: 'node' };
          astData.entities.push(sourceNode);
        }
        let targetNode = astData.entities.find(n => n.label === targetName || n.label.startsWith(targetName + ':'));
        if (!targetNode) {
          targetNode = { id: `inst_${targetName}_${lineNumber}`, label: targetName, type: 'Instance', startLine: lineNumber, endLine: lineNumber, semanticRole: 'node' };
          astData.entities.push(targetNode);
        }

        astData.relationships.push({
          id: `flow_${sourceNode.id}_${targetNode.id}_${lineNumber}`,
          source: sourceNode.id,
          target: targetNode.id,
          label: propName,
          type: `HAS_${propName.toUpperCase()}`,
          animated: true
        });
      }
    });
  }

  private parseUniversal(code: string, languageId: string): AstData {
    const entities: ParsedEntity[] = [];
    const relationships: ParsedRelationship[] = [];
    let nodeIdCounter = 0;

    const lines = code.split('\n');
    let currentClassId: string | undefined;

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      const classMatch = line.match(/(?:class|struct|interface)\s+([a-zA-Z0-9_]+)/);
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

      const funcMatch = line.match(/(?:def|fn|func|public|private|protected)\s+(?:[a-zA-Z0-9_<>]+\s+)?([a-zA-Z0-9_]+)\s*\(/);
      if (funcMatch && !line.includes('class ') && !line.includes('new ')) {
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
