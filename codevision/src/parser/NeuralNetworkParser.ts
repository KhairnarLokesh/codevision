import { AstData, ModelParser } from './ModelService';

export class NeuralNetworkParser implements ModelParser {
  public parse(code: string, fileName: string, languageId: string, astData: AstData): AstData {
    const hasPyTorch = code.includes('torch.nn') || code.includes('nn.Module') || code.includes('import torch');
    const hasKeras = code.includes('keras.layers') || code.includes('tf.keras') || code.includes('Sequential([');
    const hasLayers = code.includes('Conv2d') || code.includes('Conv2D') || code.includes('Linear') || code.includes('Dense') || code.includes('ReLU');
    const hasCustomModule = /class\s+[a-zA-Z0-9_]+\s*\((?:keras\.layers\.Layer|nn\.Module|Layer|Module)\)/.test(code);

    if ((hasPyTorch || hasKeras || hasCustomModule) && (hasLayers || hasCustomModule)) {
      astData.metadata = { 
        ...astData.metadata, 
        diagramType: 'NEURAL_NETWORK', 
        confidence: hasCustomModule ? 0.98 : 0.90, 
        recommendedLayout: 'TB' 
      };
      astData.patterns = [...(astData.patterns || []), 'deep_learning', 'neural_layers'];

      // Pre-calculate line numbers based on character offsets
      const lineOffsets = [0];
      for (let i = 0; i < code.length; i++) {
        if (code[i] === '\n') lineOffsets.push(i + 1);
      }
      const getLineNumber = (offset: number) => {
        const lineIdx = lineOffsets.findIndex(o => o > offset);
        return lineIdx === -1 ? lineOffsets.length : lineIdx;
      };

      // 1. Direct Layer Assignments: self.conv1 = nn.Conv2d(...) or self.kernel_gen = keras.Sequential(...)
      const layerRegex = /(?:self\.)?([a-zA-Z0-9_]+)\s*=\s*((?:nn\.|layers\.|keras\.layers\.|keras\.)?([A-Z][a-zA-Z0-9]+)\s*\([^)]*\))/g;
      let match;
      while ((match = layerRegex.exec(code)) !== null) {
        const varName = match[1];
        const fullLayerCall = match[2];
        const layerType = match[3];
        const lineNumber = getLineNumber(match.index);
        this.addLayerNode(varName, layerType, astData, undefined, fullLayerCall, lineNumber);
      }

      // 2. Sequential Blocks (including those assigned to variables)
      const sequentialRegex = /(?:keras\.|layers\.|nn\.)?Sequential\s*\(\s*\[([\s\S]*?)\]\s*\)/g;
      while ((match = sequentialRegex.exec(code)) !== null) {
        const content = match[1];
        const seqLine = getLineNumber(match.index);
        const innerLayers = [...content.matchAll(/((?:layers\.|nn\.|keras\.layers\.)?([A-Z][a-zA-Z0-9]+)\s*\([^)]*\))/g)];
        innerLayers.forEach((layerMatch, layerIdx) => {
          const fullLayerCall = layerMatch[1];
          const layerType = layerMatch[2];
          this.addLayerNode(`seq_l${seqLine}_${layerIdx}`, layerType, astData, `Layer ${layerIdx}`, fullLayerCall, seqLine);
        });
      }
    }

    return astData;
  }

  private addLayerNode(id: string, layerType: string, astData: AstData, labelOverride?: string, codeContext?: string, lineNumber: number = 0) {
    const validLayers: { [key: string]: string } = {
      'Conv2d': 'Conv',
      'Conv2D': 'Conv',
      'Linear': 'Linear',
      'Dense': 'Dense',
      'MaxPool2d': 'MaxPool',
      'MaxPool2D': 'MaxPool',
      'AveragePooling2D': 'AvgPool',
      'ReLU': 'ReLU',
      'Flatten': 'Reshape',
      'Softmax': 'Softmax',
      'Reshape': 'Reshape',
      'BatchNormalization': 'BatchNormalization',
      'Sequential': 'Sequential'
    };

    const normalizedType = validLayers[layerType] || 'Neural Layer';
    
    if (Object.keys(validLayers).includes(layerType) || normalizedType === 'Neural Layer') {
      if (!astData.entities.find(e => e.id === `layer_${id}`)) {
        let weights = '';
        let biases = '';
        
        if (codeContext) {
          const params = codeContext.match(/\(([^)]+)\)/);
          if (params) {
            const parts = params[1].split(',').map(p => p.trim());
            if (normalizedType === 'Conv' || layerType === 'Conv2D') {
              weights = parts[0]?.includes('=') ? parts[0].split('=')[1] : parts[0];
              weights = weights ? `<Filters: ${weights}>` : '';
            }
          }
        }

        astData.entities.push({
          id: `layer_${id}`,
          label: labelOverride || id,
          type: normalizedType,
          startLine: lineNumber,
          endLine: lineNumber,
          semanticRole: 'layer',
          metadata: { 
            layerType,
            weights,
            biases
          }
        });
      }
    }
  }
}
