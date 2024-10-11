import { FileTreeItem } from "./file-tree";

describe('FileTreeItem', () => {
  it('should create a file tree item with no children', () => {
    const filePath = '/path/to/file';
    const label = 'testFile.ts';
    const lineNumber = 10;

    const item = new FileTreeItem(filePath, label, lineNumber, undefined);

    expect(item.label).toBe(label);
    expect(item.tooltip).toBe(`${label} (${filePath})`);
    expect(item.description).toBe('');
    console.log('8888',item.command, filePath)
    expect(item.command).toEqual({
      command: 'extension.openFileAtLine',
      title: 'Open File',
      arguments: [{ fsPath: filePath}, lineNumber],
    });
    expect(item.iconPath).toBeUndefined();
  });

  it('should create a file tree item with children', () => {
    const filePath = '/path/to/file';
    const label = 'testFile.ts';
    const childItem = new FileTreeItem(filePath, 'Child Item', 15, undefined);

    const item = new FileTreeItem(filePath, label, null, [childItem]);

    expect(item.label).toBe(label);
    expect(item.tooltip).toBe(`${label} (${filePath})`);
    expect(item.description).toBe(filePath);
    expect(item.command).toEqual({
      command: 'vscode.open',
      title: 'Open File',
      arguments: [{ fsPath: filePath}],
    });
    expect(item.children).toEqual([childItem]);
  });
});
