import { AstData } from '../parser/AstParser';

export class GraphBuilder {
  public build(astData: AstData): any {
    const reactFlowNodes = astData.entities.map(entity => {
      return {
        id: entity.id,
        position: { x: 0, y: 0 }, // Dagre/Layout engine will set this
        data: { 
          label: entity.label,
          type: entity.type,
          startLine: entity.startLine,
          semanticRole: entity.semanticRole
        },
        type: 'customNode'
      };
    });

    const reactFlowEdges = astData.relationships.map(rel => {
      return {
        id: rel.id,
        source: rel.source,
        target: rel.target,
        label: rel.label || rel.type,
        type: 'smoothstep',
        animated: rel.animated || false
      };
    });

    return {
      entities: reactFlowNodes,
      relationships: reactFlowEdges,
      architecture: astData.architecture || [],
      runtime: astData.runtime || [],
      metadata: {
        diagramType: astData.metadata?.diagramType || 'GENERIC',
        confidence: astData.metadata?.confidence || 0.1,
        recommendedLayout: astData.metadata?.recommendedLayout || 'GRID',
        patterns: astData.patterns || []
      }
    };
  }
}
