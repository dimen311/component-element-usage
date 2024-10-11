import vscode from "vscode";
 
 
export class FileTreeItem extends vscode.TreeItem {
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





export function deactivate() { }
