import * as vscode from "vscode";
import { FileFinder } from "./file-finder";
import { FileTreeDataProvider } from "./file-tree-data-provider";
import { ComponentIndexManager } from './component-index';

export function activate(context: vscode.ExtensionContext) {
	const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath || '';
	const indexManager = new ComponentIndexManager(workspaceRoot, context);
	let rebuildTimeout: NodeJS.Timeout | undefined;

	// Initialize the index when the extension activates
	indexManager.buildIndex().catch(error => {
		console.error('Failed to build initial index:', error);
	});

	// Create file watcher for component files
	const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{ts,html}', false, false);

	// Debounced rebuild function
	const debouncedRebuild = () => {
		if (rebuildTimeout) {
			clearTimeout(rebuildTimeout);
		}
		rebuildTimeout = setTimeout(async () => {
			await indexManager.buildIndex();
			rebuildTimeout = undefined;
		}, 10000); // 10 seconds delay
	};

	// Handle file changes
	fileWatcher.onDidChange(() => {
		debouncedRebuild();
	});

	// Handle file creation
	fileWatcher.onDidCreate(() => {
		debouncedRebuild();
	});

	// Handle file deletion
	fileWatcher.onDidDelete(() => {
		debouncedRebuild();
	});

	context.subscriptions.push(fileWatcher);

	let disposable = vscode.commands.registerCommand('component_element_usage.findComponentUsage', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('No active editor');
			return;
		}

		let document = editor.document;
		let fileName = document.fileName;
		const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
		if (!workspaceFolder) {
			vscode.window.showInformationMessage('No workspace folder found');
			return;
		}

		// if document is html template, find component that uses it
		if (document.languageId === 'html') {
			fileName = indexManager.getComponentByTemplatePath(document.uri.fsPath);

		}
		if (!fileName) {
			vscode.window.showInformationMessage('No component found for this template');
			return;
		}

		const fileFinder = new FileFinder(fileName, workspaceFolder.uri.fsPath, context);
		const usages = await fileFinder.init();

		const fileTreeDataProvider = new FileTreeDataProvider();
		vscode.window.createTreeView(
			"elementUsageExplorer",
			{
				treeDataProvider: fileTreeDataProvider,
				showCollapseAll: true
			}
		);

		fileTreeDataProvider.showLoading();

		setTimeout(() => {
			fileTreeDataProvider.showResults(usages);
			// Show the tree view in the explorer
			vscode.commands.executeCommand('workbench.view.explorer');
			// Move focus to the tree view
			vscode.commands.executeCommand('elementUsageExplorer.focus');
		}, 100);
	});

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
