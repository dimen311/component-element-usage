import { FileFinder } from './file-finder';
import vscode from 'vscode';
import { ComponentIndexManager } from './component-index';
import * as path from 'path';

jest.mock('./component-index');
jest.mock('path');

describe('FileFinder', () => {
  let mockedPathJoin: jest.MockedFunction<typeof path.join>;
  let mockedReadFile: jest.MockedFunction<typeof vscode.workspace.fs.readFile>;
  let mockIndexManagerInstance: jest.Mocked<ComponentIndexManager>;
  let mockContext: any;

  beforeEach(() => {
    // Mock missing properties from `vscode` that are undefined in the test environment
    (vscode.ExtensionMode as any) = { Development: 1, Test: 2, Release: 3 };
    (vscode.ExtensionKind as any) = { UI: 1, Workspace: 2 };

    mockedPathJoin = path.join as jest.MockedFunction<typeof path.join>;
    mockedReadFile = vscode.workspace.fs.readFile as jest.MockedFunction<typeof vscode.workspace.fs.readFile>;

    const mockMemento = {
      get: jest.fn(),
      update: jest.fn(),
      setKeysForSync: jest.fn(),
    };

    const mockEnvCollection = {
      getScoped: jest.fn(),
      persistent: true,
      description: 'Mock env collection',
      replace: jest.fn(),
      append: jest.fn(),
      prepend: jest.fn(),
      get: jest.fn(),
      forEach: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    };

    const mockSecretStorage = {
      get: jest.fn(),
      store: jest.fn(),
      delete: jest.fn(),
    };

    mockContext = {
      subscriptions: [],
      extensionPath: '/mock/extension/path',
      globalStorageUri: vscode.Uri.file('/mock/storage/path'),
      asAbsolutePath: jest.fn((relativePath: string) => `/mock/absolute/path/${relativePath}`),
      storageUri: vscode.Uri.file('/mock/storage/path'),
      globalState: mockMemento,
      workspaceState: mockMemento,
      secrets: mockSecretStorage,
      environmentVariableCollection: mockEnvCollection,
      extensionMode: vscode.ExtensionMode.Development,
      extensionKind: vscode.ExtensionKind.Workspace,
    };

    mockIndexManagerInstance = {
      buildIndex: jest.fn(),
      updateFileInIndex: jest.fn(),
      findComponentUsages: jest.fn(),
    } as unknown as jest.Mocked<ComponentIndexManager>;

    (ComponentIndexManager as jest.MockedClass<typeof ComponentIndexManager>).mockImplementation(() => mockIndexManagerInstance);

    jest.clearAllMocks();

    mockedPathJoin.mockImplementation((...args) => args.join('/'));
  });

  describe('init', () => {
    it('should initialize the search and find matching files', async () => {
      const fileFinder = new FileFinder('testFile.ts', '/project', mockContext);

      const mockContent = `
        @Component({
          selector: 'app-test',
        })
      `;

      mockedReadFile.mockResolvedValue(Buffer.from(mockContent));
      mockIndexManagerInstance.buildIndex.mockResolvedValue();
      mockIndexManagerInstance.findComponentUsages.mockReturnValue([]);

      const result = await fileFinder.init();

      expect(mockedReadFile).toHaveBeenCalledWith(vscode.Uri.file('testFile.ts'));
      expect(mockIndexManagerInstance.buildIndex).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

});
