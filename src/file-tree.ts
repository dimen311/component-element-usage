import * as vscode from "vscode";
import * as path from "path";
import { FoundFile } from "./types";

// Define a TreeItem for files
class FileTreeItem extends vscode.TreeItem {
  constructor(
    public readonly filePath: string,
    public readonly label: string,
    public readonly lineNumber: number | null,
    public readonly children: FileTreeItem[] | undefined,
    public readonly options?: {
      iconPath?: string | vscode.Uri | { light: string | vscode.Uri; dark: string | vscode.Uri } | vscode.ThemeIcon;
    }
  ) {
    super(
      label,
      children === undefined
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Expanded
    );
    if (options && options.iconPath) {
      this.iconPath = options.iconPath;
    }
    this.tooltip = `${this.label} (${this.filePath})`;
    this.description = children === undefined ? `` : `${this.filePath}`;

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
}

// Create a TreeDataProvider to provide the file tree structure
export class FileTreeDataProvider
  implements vscode.TreeDataProvider<FileTreeItem> {

  private _onDidChangeTreeData = new vscode.EventEmitter<FileTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<FileTreeItem | undefined | void> = this._onDidChangeTreeData.event;

  private files: FoundFile[] = [];
  private isLoading: boolean = false;
  constructor() {}

  getTreeItem(element: FileTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: FileTreeItem): FileTreeItem[] {
    if (this.isLoading) {
      return [new FileTreeItem('', 'Loading...', null, undefined, {
        iconPath: new vscode.ThemeIcon('loading~spin')
      })];
    }
    // If no element is passed, return the root files
    if (!element) {
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

          return new FileTreeItem(file.path, fileName, null, children);
        } else {
          return new FileTreeItem(file.path, fileName, null, undefined);
        }
      });
    } else {
      return element.children || [];
    }
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  // Call this method to show the loading indicator
  showLoading(): void {
    this.isLoading = true;
    this.refresh();
  }

  // Call this method when search is complete
  showResults(searchResults: FoundFile[]): void {
    this.isLoading = false;
    this.files = searchResults;
    this.refresh();
  }
}



export function deactivate() { }
