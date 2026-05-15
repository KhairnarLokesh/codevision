import { AstData, ModelParser } from './ModelService';

export class DataStructureParser implements ModelParser {
  public parse(code: string, fileName: string, languageId: string, astData: AstData): AstData {
    const lines = code.split('\n');
    let hasLeftRight = false;
    let hasNext = false;
    let hasGraph = false;
    let hasStack = false;
    let hasQueue = false;
    let hasArray = false;

    lines.forEach(line => {
      if (line.match(/[A-Za-z0-9_]+\s*[:\.]?\s*(?:left|right|next|prev|parent|child)\b/)) hasLeftRight = true;
      if (line.match(/[A-Za-z0-9_]+\s*[:\.]?\s*(?:next|prev)\b/)) hasNext = true;
      if (line.match(/[A-Za-z0-9_]+\.(?:addEdge|add_edge)\s*\(/)) hasGraph = true;
      if (line.includes('Stack') || line.includes('stack')) hasStack = true;
      if (line.includes('Queue') || line.includes('queue') || line.includes('LinkedList')) hasQueue = true;
      if (line.match(/(?:[a-zA-Z0-9_<>]+)\[\]\s+[a-zA-Z0-9_]+\s*=\s*\{/)) hasArray = true;
    });

    if (hasLeftRight) {
      astData.metadata = { ...astData.metadata, diagramType: 'BINARY_TREE', confidence: 0.95, recommendedLayout: 'TB' };
      astData.patterns = [...(astData.patterns || []), 'recursive_class', 'left_right_pointers'];
    } else if (hasNext) {
      astData.metadata = { ...astData.metadata, diagramType: 'LINKED_LIST', confidence: 0.92, recommendedLayout: 'LR' };
      astData.patterns = [...(astData.patterns || []), 'recursive_class', 'next_pointer'];
    } else if (hasGraph) {
      astData.metadata = { ...astData.metadata, diagramType: 'GRAPH', confidence: 0.95, recommendedLayout: 'LR' };
      astData.patterns = [...(astData.patterns || []), 'graph_edges'];
    } else if (hasStack) {
      astData.metadata = { ...astData.metadata, diagramType: 'STACK_MEMORY', confidence: 0.95, recommendedLayout: 'TB' };
      astData.patterns = [...(astData.patterns || []), 'lifo_stack'];
    } else if (hasQueue) {
      astData.metadata = { ...astData.metadata, diagramType: 'QUEUE_MEMORY', confidence: 0.95, recommendedLayout: 'LR' };
      astData.patterns = [...(astData.patterns || []), 'fifo_queue'];
    } else if (hasArray) {
      astData.metadata = { ...astData.metadata, diagramType: 'ARRAY_MEMORY', confidence: 0.95, recommendedLayout: 'LR' };
      astData.patterns = [...(astData.patterns || []), 'array_initialization'];
    }

    return astData;
  }
}
