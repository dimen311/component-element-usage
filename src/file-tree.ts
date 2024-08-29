import * as vscode from "vscode";
import * as path from "path";

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

  constructor(private files: any[]) {}

  getTreeItem(element: FileTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: FileTreeItem): FileTreeItem[] {
    // If no element is passed, return the root files
    if (!element) {
      // return Promise.resolve(
      return this.files.map((file) => {
        const fileName = path.basename(file.path);
        if (file.content) {
          const child = new FileTreeItem(
            file.path,
            file.content,
            file.lineNumber,
            undefined
          );

          const itms = new FileTreeItem(file.path, fileName, null, [child]);
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

// export function activate(context: vscode.ExtensionContext) {
//     // Example list of file paths; replace this with your own list
//     const filePaths = [
//         '/path/to/your/file1.txt',
//         '/path/to/your/file2.txt',
//         '/path/to/your/file3.html'
//     ];

//     const fileTreeDataProvider = new FileTreeDataProvider(filePaths);

//     vscode.window.createTreeView('myCustomExplorer', {
//         treeDataProvider: fileTreeDataProvider
//     });

//     // Example command to refresh the view
//     const refreshCommand = vscode.commands.registerCommand('extension.refreshView', () => {
//         fileTreeDataProvider.refresh();
//     });

//     context.subscriptions.push(refreshCommand);
// }

export function deactivate() {}
