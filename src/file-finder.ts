import * as path from "path";
import vscode from "vscode";
import { ComponentIndexManager } from "./component-index";
import { FoundFile } from "./types";

export class FileFinder {
  private roothPath: string;
  private filePath: string;

  private searchedSelector: string;
  private indexManager: ComponentIndexManager;

  constructor(filePath: string, roothPath: string, context: vscode.ExtensionContext) {
    this.filePath = filePath;
    this.roothPath = roothPath;

    this.searchedSelector = '';
    this.indexManager = new ComponentIndexManager(roothPath, context);
  }

  public async init() {
    const searchedFileContent = await this.getFileContent(this.filePath);
    this.searchedSelector = this.extractComponenSelector(searchedFileContent);

    if (!this.indexManager.isIndexBuilt) {
      await this.indexManager.buildIndex();
    }
    return await this.findFiles();
  }

  private async findFiles(): Promise<FoundFile[]> {
    if (!this.searchedSelector) {
      return [];
    }

    // Remove the < character we added for searching
    const selector = this.searchedSelector.substring(1);
    const usages = this.indexManager.findComponentUsages(selector);

    const filteredFiles: FoundFile[] = [];
    for (const usage of usages) {
      const filePath = path.join(this.roothPath, usage.file);
      const content = await this.getFileContent(filePath);
      const lines = content.split("\n");
      const foundLines = usage.lines.map(lineNum => lines[lineNum - 1]);

      filteredFiles.push({
        path: filePath,
        lines: foundLines,
        lineNumber: usage.lines
      });
    }

    return filteredFiles;
  }

  private async getFileContent(filePath: string): Promise<string> {
    const content = await vscode.workspace.fs.readFile(
      vscode.Uri.file(filePath)
    );
    return Buffer.from(content).toString("utf8");
  }

  extractComponenSelector(fileContent: string): string {
    const regex = /@Component\(\s*{[^}]*?\bselector:\s*'([^']*)'/;
    const match = fileContent.match(regex);
    return match ? ("<" + match[1]) : "";
  }
}
