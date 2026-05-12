const { AstParser } = require('./out/parser/AstParser');
const { StaticAnalyzer } = require('./out/analyzer/StaticAnalyzer');

const parser = new AstParser();
const analyzer = new StaticAnalyzer();

const code = 'function doSomething() { }';

try {
  const astData = parser.parse(code, 'index.js', 'javascript');
  console.log('AST:', astData);
  
  const analysisData = analyzer.analyze(code, 'index.js', 'javascript');
  console.log('Analysis:', analysisData);
} catch (e) {
  console.error('Error:', e);
}
