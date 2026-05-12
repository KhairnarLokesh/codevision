"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphBuilder = void 0;
class GraphBuilder {
    build(astData) {
        // Simple layout strategy: arrange nodes in a grid or sequentially
        // A proper auto-layout algorithm like Dagre would be used in a production version.
        const reactFlowNodes = astData.nodes.map((node, index) => {
            // Very basic pseudo-layout
            const x = (index % 4) * 200;
            const y = Math.floor(index / 4) * 150;
            return {
                id: node.id,
                position: { x, y },
                data: {
                    label: node.label,
                    type: node.type,
                    startLine: node.startLine
                },
                type: 'customNode' // We will define a custom node in React
            };
        });
        const reactFlowEdges = astData.edges.map(edge => {
            return {
                id: edge.id,
                source: edge.source,
                target: edge.target,
                label: edge.label,
                type: 'smoothstep',
                animated: true
            };
        });
        return {
            nodes: reactFlowNodes,
            edges: reactFlowEdges
        };
    }
}
exports.GraphBuilder = GraphBuilder;
//# sourceMappingURL=GraphBuilder.js.map