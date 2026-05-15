<div align="center">
  <h1>⚡ CodeVision</h1>
  <p><strong>Universal AI-Powered Semantic Code Visualization Engine for VS Code</strong></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![VS Code](https://img.shields.io/badge/VS%20Code-Extension-blueviolet.svg)](https://code.visualstudio.com/)
  [![React](https://img.shields.io/badge/Powered%20by-React%20Flow-61dafb.svg)](https://reactflow.dev/)
</div>

<br>
CodeVision is an advanced, real-time code visualization system that lives directly inside your editor. It goes far beyond traditional "dumb" graph renderers. By utilizing a custom **Semantic Pattern Detection Engine**, CodeVision actively reads your source code, understands its architecture, and dynamically renders the most accurate, interactive visualization on the fly.

Whether you are building complex Data Structures, full-stack React component trees, layered backend Express APIs, or standard OOP architectures, CodeVision understands your intent and maps it instantly.

## ✨ Features

* 🧠 **Semantic Pattern Engine**: CodeVision analyzes your AST (Abstract Syntax Tree) to figure out *what* you are building. It automatically classifies patterns like Binary Trees, Linked Lists, Component Trees, and Database Schemas.
* ⚡ **Instant Real-Time Rendering**: Every keystroke and file save triggers an instant, debounce-optimized refresh of the visualization dashboard (under 300ms latency).
* 🔄 **Bidirectional Sync**: Click on any node, class, object, or function in the interactive graph, and your VS Code cursor will instantly jump to the exact line of code where it was declared.
* 🎨 **Cinematic Interactive UI**: Powered by React Flow and Dagre, the visualization features premium glassmorphic UI elements, glowing active nodes, zooming, panning, and a functional minimap.
* 🌍 **Universal Multi-Language Support**: Supports JavaScript, TypeScript, React (JSX/TSX), Python, Java, Go, Rust, and C++.

---

## 🏗️ How it Works

The CodeVision pipeline transforms raw code into interactive developer intelligence:

1. **AST Parsing Pipeline**: Natively parses JS/TS using the TypeScript Compiler API, and uses a lightning-fast universal regex heuristic engine for other languages.
2. **Semantic Relationship Extraction**: Extracts not just "nodes", but semantic roles. It maps `DEPENDS_ON`, `HAS_NEXT`, `HAS_LEFT`, `CONTAINS`, and `RENDERS` relationships.
3. **Architecture Detection**: 
   * Spots `left` and `right` pointers inside a self-referencing class? It applies the **Binary Tree (TB)** layout.
   * Spots `next` pointers? It applies the **Linked List (LR)** layout.
   * Spots React hooks and JSX? It applies the **Component Architecture** layout.
4. **Universal Graph Model**: Converts all architectures into a standardized Entity-Relationship (ER) model.

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/en/) (v16 or higher)
* [Visual Studio Code](https://code.visualstudio.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/KhairnarLokesh/codevision.git
   ```
2. Navigate to the extension directory and install dependencies:
   ```bash
   cd codevision/codevision
   npm install
   ```
3. Install frontend webview dependencies:
   ```bash
   cd webview-ui
   npm install
   ```

### Running Locally

To launch the extension in development mode:
1. Run the backend compiler:
   ```bash
   npm run compile
   ```
2. Build the React frontend:
   ```bash
   cd webview-ui
   npm run build
   ```
3. Press **`F5`** inside VS Code to launch the **Extension Development Host**.
4. In the new window, open any codebase and run the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):
   ```
   CodeVision: Start Visualization
   ```

---

## 🛠️ Technology Stack

* **Extension Core**: Node.js, TypeScript, VS Code Extension API
* **Parsers**: TypeScript Compiler API
* **Visualization Frontend**: React 18, Vite, `@xyflow/react` (React Flow), Dagre (Auto-layout), Lucide React (Icons)
* **Styling**: Vanilla CSS, Glassmorphism, CSS Variables

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check out the [issues page](https://github.com/KhairnarLokesh/codevision/issues).

## 📝 License

This project is licensed under the MIT License.
