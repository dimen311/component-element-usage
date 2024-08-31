import * as path from "path";
import * as vscode from "vscode";
//@ts-ignore
import { glob, globSync, globStream, globStreamSync, Glob } from "glob";
import { FoundFile } from "./types";
import { Helper } from "./helper";

export class FileFinder {
  roothPath: string;
  filePath: string;
     //@ts-ignore
  searchedSelector: string;
  searchPatern: string;
  constructor(filePath: string, roothPath: string, searchPatern: string) {
    this.filePath = filePath;
    //const searchPattern = `**/${componentName}`;
    this.roothPath = roothPath;
    //this.componentName = componentName;
    this.searchPatern = searchPatern;
  }

  public async init() {
    const searchedFileContent = await this.getFileContent(this.filePath);
    this.searchedSelector = this.extractComponenSelector(searchedFileContent);
    return await this.findFiles();
  }

  private async findFiles(): Promise<FoundFile[]> {
   
    const files = await glob(this.searchPatern, { 
      //@ts-ignore
      cwd: this.roothPath,
      ignore: "node_modules/**",
    });

    const filteredFiles: FoundFile[] = [];
       //@ts-ignore
    for (const file of files) {
      const filePath = path.join(this.roothPath || "", file);
      const contentStr = await this.getFileContent(filePath);
      if (contentStr.includes(this.searchedSelector)) {
        const lines = contentStr.split("\n");
        const allIndexes = Helper.findIndexAll(lines, this.searchedSelector);
        const foundLines = allIndexes.map(index => lines[index]);
        const foundFile: FoundFile = { path: filePath, lines: foundLines, lineNumber: allIndexes };
        filteredFiles.push(foundFile);
      }
    }
    return filteredFiles;

  }

  private async getFileContent(filePath: string): Promise<string> {
    const content = await vscode.workspace.fs.readFile(
      vscode.Uri.file(filePath)
    );
    return new Promise((resolve, reject) => {
      resolve(Buffer.from(content).toString("utf8"));
    });
  }

  extractComponenSelector(fileContent: string): string {
    // 
    const regex = /@Component\(\s*{[^}]*?\bselector:\s*'([^']*)'/;
    const match = fileContent.match(regex);
    return match ? "<" + match[1] : "";
  }
}
