// Traversal Test for CodeVision
class GNode {
    id: number;
    neighbors: GNode[] = [];
    constructor(id: number) { this.id = id; }
}

const n1 = new GNode(1);
const n2 = new GNode(2);
const n3 = new GNode(3);
const n4 = new GNode(4);

n1.neighbors.push(n2);
n2.neighbors.push(n3);
n3.neighbors.push(n4);
n4.neighbors.push(n1);

function traverse(start: GNode) {
    const visited = new Set();
    const queue = [start];
    
    while (queue.length > 0) {
        const current = queue.shift();
        if (!current || visited.has(current)) continue;
        
        visited.add(current);
        console.log(`Visiting node ${current.id}`); // Set breakpoint here
        
        for (const neighbor of current.neighbors) {
            queue.push(neighbor);
        }
    }
}

// To see traversal in action:
// 1. Open the CodeVision panel
// 2. Set a breakpoint on the console.log line above
// 3. Start debugging this file
traverse(n1);
