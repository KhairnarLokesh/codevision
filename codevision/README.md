# CodeVision

CodeVision is a production-level VS Code Extension that provides real-time dynamic visualization of your source code.

## Features

- **Real-time Code Visualization:** As you type, CodeVision analyzes your TypeScript and JavaScript code and updates an interactive node-edge graph instantly.
- **AST Parsing Engine:** Leverages the native TypeScript Compiler API to safely parse and extract functions, classes, and variables without native dependency issues.
- **Dynamic Visualization:** Uses React Flow to render smooth, interactive graphs of your code architecture.
- **Modern Dashboard UI:** Built with React and Lucide icons, offering a minimal, professional developer-tool aesthetic with dark themes and glassmorphism.

## Requirements

- Visual Studio Code 1.80.0 or higher.
- Node.js (for building and running).

## Setup Instructions

1. Clone or copy the project into your local workspace.
2. Open the terminal and run `npm install` in the root directory:
   ```bash
   cd codevision
   npm install
   ```
3. Install the webview UI dependencies:
   ```bash
   cd webview-ui
   npm install
   ```
4. Build the webview UI:
   ```bash
   npm run build
   ```
5. Press \`F5\` in VS Code to launch the Extension Development Host.
6. In the new VS Code window, run the command **"CodeVision: Start Visualization"** via the Command Palette (\`Ctrl+Shift+P\` or \`Cmd+Shift+P\`).
7. Open any TypeScript or JavaScript file to see the real-time graph update.

## Architecture

- **Extension Core:** Handles file watching and AST parsing.
- **Graph Engine:** Converts the TypeScript AST into nodes and edges for React Flow.
- **Webview UI:** A standalone React/Vite app hosted inside a VS Code webview panel, receiving graph data via message passing.

## Future Plans

- AI-generated code explanations
- Advanced Cyclomatic Complexity Metrics
- ESLint, PMD, and SpotBugs integrations
