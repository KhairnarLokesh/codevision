import { AstData, ParsedEntity, ParsedRelationship } from './AstParser';

export interface ModelParser {
  parse(code: string, fileName: string, languageId: string, currentData: AstData): AstData;
}

export class ModelService {
  private parsers: ModelParser[] = [];

  public register(parser: ModelParser): void {
    this.parsers.push(parser);
  }

  public analyze(code: string, fileName: string, languageId: string, initialData: AstData): AstData {
    let result = { ...initialData };
    for (const parser of this.parsers) {
      result = parser.parse(code, fileName, languageId, result);
    }
    return result;
  }
}
