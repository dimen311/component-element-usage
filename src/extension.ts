import * as vscode from "vscode";
import { FileFinder } from "./file-finder";

import { FileTreeDataProvider } from "./file-tree";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "component_element_usage.findComponentUsage",
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        vscode.window.showErrorMessage("No active editor found.");
        return;
      }

      const filePath = editor.document.uri.fsPath;

      const searchPatern = `**/*.{html,htm}`;

      const fileTreeDataProvider = new FileTreeDataProvider();
      vscode.window.registerTreeDataProvider(
        "elementUsageExplorer",
        fileTreeDataProvider
      );

      fileTreeDataProvider.showLoading();

      const fileFinder = new FileFinder(
        filePath,
        vscode.workspace.rootPath || "",
        searchPatern
      );
      const foundedFiles = await fileFinder.init();

      setTimeout(() => {
        fileTreeDataProvider.showResults(foundedFiles);
      }, 100);


    }
  );
  context.subscriptions.push(disposable);

  let openFileCommand = vscode.commands.registerCommand('extension.openFileAtLine', async (filePath, lineNumber) => {

    await vscode.commands.executeCommand('vscode.open', filePath, {
      viewColumn: vscode.ViewColumn.One,
      preserveFocus: true,
      preview: false
    });

    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const position = new vscode.Position(lineNumber - 1, 0); // Line numbers are zero-based
      const range = new vscode.Range(position, position);
      editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
    }
  });

  context.subscriptions.push(openFileCommand);
}

export function deactivate() { }
