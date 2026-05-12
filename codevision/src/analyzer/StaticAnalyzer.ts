import { Linter } from 'eslint';

export interface AnalysisResult {
  warnings: number;
  errors: number;
  messages: Array<{ line: number; message: string; severity: number }>;
}

export class StaticAnalyzer {
  private linter: Linter;

  constructor() {
    this.linter = new Linter();
  }

  public analyze(code: string, fileName: string, languageId: string): AnalysisResult {
    if (languageId === 'typescript' || languageId === 'javascript' || languageId === 'typescriptreact') {
      return this.analyzeWithEslint(code, fileName);
    }
    
    return this.analyzeUniversally(code);
  }

  private analyzeUniversally(code: string): AnalysisResult {
    // Universal regex heuristics for code complexity and smells
    let warnings = 0;
    let errors = 0;
    
    const lines = code.split('\n');
    lines.forEach(line => {
      // Basic complexity detection
      if (line.match(/(?:if|for|while|catch)\s*\(/g)) {
        // High cognitive complexity per line
        const matches = line.match(/(?:if|for|while|catch)\s*\(/g);
        if (matches && matches.length > 2) {
          warnings++;
        }
      }
      
      // Print/Console detection
      if (line.match(/(?:print|console\.log|println|printf|fmt\.Println)\s*\(/)) {
        warnings++;
      }

      // Generic TODO detection
      if (line.match(/TODO|FIXME/i)) {
        warnings++;
      }
    });

    return { warnings, errors, messages: [] };
  }

  private analyzeWithEslint(code: string, fileName: string): AnalysisResult {
    try {
      const messages = this.linter.verify(code, {
        env: { es6: true, browser: true, node: true },
        parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
        rules: {
          'no-unused-vars': 1,
          'no-console': 1,
          'eqeqeq': 2,
          'no-var': 2,
          'prefer-const': 1,
          'complexity': [1, { max: 5 }]
        }
      }, { filename: fileName });

      let warnings = 0;
      let errors = 0;

      const formattedMessages = messages.map(m => {
        if (m.severity === 1) warnings++;
        if (m.severity === 2) errors++;
        return {
          line: m.line,
          message: m.message,
          severity: m.severity
        };
      });

      return {
        warnings,
        errors,
        messages: formattedMessages
      };
    } catch (e) {
      console.error("Linter error:", e);
      return { warnings: 0, errors: 0, messages: [] };
    }
  }
}
