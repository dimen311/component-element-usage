
import { FileTreeItem } from './file-tree';
import { FileTreeDataProvider } from './file-tree-data-provider';
import vscode from 'vscode'

describe('FileTreeDataProvider', () => {
  let provider: FileTreeDataProvider;

  beforeEach(() => {
    provider = new FileTreeDataProvider();
  });

  it('should return a loading item when isLoading is true', () => {
    provider.showLoading();

    const children = provider.getChildren();
    expect(children.length).toBe(1);
    expect(children[0].label).toBe('Loading...');
  });

  it('should return root files when getChildren is called without an element', () => {
    const searchResults = [
      {
        path: '/path/to/file1.ts',
        lines: ['Line 1', 'Line 2'],
        lineNumber: [1, 2],
      }
    ];

    provider.showResults(searchResults);

    const children = provider.getChildren();
    expect(children.length).toBe(1);
    expect(children[0].label).toBe('file1.ts');
    expect(children[0].children!.length).toBe(2);
  });

  it('should return child items when an element with children is passed', () => {
    const filePath = '/path/to/file.ts';
    const parentItem = new FileTreeItem(filePath, 'parent', null, [
      new FileTreeItem(filePath, 'child', 5, undefined),
    ]);

    const children = provider.getChildren(parentItem);
    expect(children.length).toBe(1);
    expect(children[0].label).toBe('child');
  });

});
