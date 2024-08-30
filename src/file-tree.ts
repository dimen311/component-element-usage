import * as vscode from "vscode";
import * as path from "path";
import { FoundFile } from "./types";

// Define a TreeItem for files
class FileTreeItem extends vscode.TreeItem {
  constructor(
    public readonly filePath: string,
    public readonly label: string,
    public readonly lineNumber: number | null,
    public readonly children: FileTreeItem[] | undefined
  ) {
    super(
      label,
      children === undefined
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Expanded
    );
    this.tooltip = `${this.label} (${this.filePath})`;
    this.description = this.filePath;

    this.children = children;
    if (children) {
      this.command = {
        command: "vscode.open",
        title: "Open File",
        arguments: [vscode.Uri.file(this.filePath)],
      };
    } else {
      this.command = {
        command: "extension.openFileAtLine",
        title: "Open File",
        arguments: [vscode.Uri.file(this.filePath), this.lineNumber],
      };
    }
  }

  contextValue = "fileTreeItem";
}

// Create a TreeDataProvider to provide the file tree structure
export class FileTreeDataProvider
  implements vscode.TreeDataProvider<FileTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<FileTreeItem | undefined> =
    new vscode.EventEmitter<FileTreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<FileTreeItem | undefined> =
    this._onDidChangeTreeData.event;

  constructor(private files: FoundFile[]) {}

  getTreeItem(element: FileTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: FileTreeItem): FileTreeItem[] {
    // If no element is passed, return the root files
    if (!element) {
      // return Promise.resolve(
      return this.files.map((file) => {
        const fileName = path.basename(file.path);
        if (file.lines?.length) {
          const children = [];
        for (let index = 0; index < file.lines.length; index++) {
          const line = file.lines[index];
          const lineNumber = file.lineNumber[index];
          const child = new FileTreeItem(
            file.path,
            line,
            lineNumber,
            undefined
          );
          children.push(child);
        }
         

          const itms = new FileTreeItem(file.path, fileName, null, children);
          return itms;
        } else {
          return new FileTreeItem(file.path, fileName, null, undefined);
        }
      });
      //  );
    } else {
      // If an element is passed, return its children
      return element.children || [];
    }
    //return Promise.resolve([]);
    /// return [];
  }

  refresh() {
    //@ts-ignore
    this._onDidChangeTreeData.fire();
  }
}


export function deactivate() {}
