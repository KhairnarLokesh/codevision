import { AstData, ModelParser } from './ModelService';

export class ArchitectureParser implements ModelParser {
  public parse(code: string, fileName: string, languageId: string, astData: AstData): AstData {
    if (astData.metadata?.diagramType && astData.metadata.diagramType !== 'GENERIC') {
        return astData; // Already specialized
    }

    const hasExpress = code.includes('express()') || code.includes('app.get');
    const hasReact = code.includes('import React') || code.includes('useState(') || code.includes('Component');
    const dbEntities = (code.match(/Model|@Entity|@Table/g) || []).length;

    if (dbEntities > 0) {
      astData.metadata = { ...astData.metadata, diagramType: 'DATABASE_SCHEMA', confidence: 0.90, recommendedLayout: 'ER_DIAGRAM' };
      astData.patterns = [...(astData.patterns || []), 'db_model', 'entity_relationships'];
    } else if (hasExpress) {
      astData.metadata = { ...astData.metadata, diagramType: 'BACKEND_API', confidence: 0.85, recommendedLayout: 'LAYERED' };
      astData.patterns = [...(astData.patterns || []), 'routing', 'api_endpoints'];
    } else if (hasReact) {
      astData.metadata = { ...astData.metadata, diagramType: 'FRONTEND_COMPONENT_TREE', confidence: 0.85, recommendedLayout: 'TB' };
      astData.patterns = [...(astData.patterns || []), 'react_components', 'jsx'];
    } else {
      // Object Graph / Composition Detection
      const compositionMatches = [...code.matchAll(/(?:this\.|self\.)([a-zA-Z0-9_]+)\s*=\s*new\s+([A-Z][a-zA-Z0-9_]+)\s*\(/g)];
      if (compositionMatches.length > 0) {
        astData.metadata = { ...astData.metadata, diagramType: 'OBJECT_GRAPH', confidence: 0.60, recommendedLayout: 'LR' };
        astData.patterns = [...(astData.patterns || []), 'composition', 'object_graph'];
      }
    }

    return astData;
  }
}
