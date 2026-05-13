// Test file for DSA Visualizer
class Node {
    value: number;
    children: Node[] = [];
    constructor(v: number) { this.value = v; }
}

const root = new Node(1);
const child1 = new Node(2);
const child2 = new Node(3);

root.children.push(child1);
root.children.push(child2);

// Adjacency List Graph
const adj = [[], [], []];
const u = 0;
const v = 1;
const w = 2;

adj[u].push(v);
adj[u].push(w);

// Linked List (Should still work)
class ListNode {
    val: number;
    next: ListNode | null = null;
    constructor(v: number) { this.val = v; }
}

const head = new ListNode(10);
const second = new ListNode(20);
head.next = second;
