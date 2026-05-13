// Stack and Queue Test for D3 Visualization
{
    class Stack {
        items: any[] = [];
        push(item: any) { this.items.push(item); }
        pop() { return this.items.pop(); }
    }

    const myStack = new Stack();
    const s1 = { val: 10 };
    const s2 = { val: 20 };
    const s3 = { val: 30 };

    myStack.push(s1);
    myStack.push(s2);
    myStack.push(s3);
    myStack.pop();

    class Queue {
        items: any[] = [];
        enqueue(item: any) { this.items.push(item); }
        dequeue() { return this.items.shift(); }
    }

    const myQueue = new Queue();
    const q1 = { id: 'A' };
    const q2 = { id: 'B' };
    const q3 = { id: 'C' };

    myQueue.enqueue(q1);
    myQueue.enqueue(q2);
    myQueue.enqueue(q3);
    myQueue.dequeue();
}
