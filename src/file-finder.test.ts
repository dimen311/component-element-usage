import { FileFinder } from './file-finder';
import vscode from 'vscode'; // This will now use the mocked version
import { Helper } from './helper';
import { glob } from 'glob';
import * as path from 'path';

// Mock Glob and Path
jest.mock('glob');
jest.mock('path');

const mockedGlob = glob as jest.MockedFunction<typeof glob>;

describe('FileFinder', () => {
  let mockedPathJoin: jest.MockedFunction<typeof path.join>;
  let mockedReadFile: jest.MockedFunction<typeof vscode.workspace.fs.readFile>;


  beforeEach(() => {
    // Reinitialize mocked functions before each test
    mockedPathJoin = path.join as jest.MockedFunction<typeof path.join>;


    mockedReadFile = vscode.workspace.fs.readFile as jest.MockedFunction<typeof vscode.workspace.fs.readFile>;

    jest.clearAllMocks(); // Clear mocks before each test
  });

  describe('init', () => {
    it('should initialize the search and find matching files', async () => {
      const fileFinder = new FileFinder('testFile.ts', '/project', '**/*.ts');

      const mockContent = `
        @Component({
          selector: 'app-test',
        })
      `;

      mockedReadFile.mockResolvedValue(Buffer.from(mockContent));

      mockedGlob.mockResolvedValue([]);

      const result = await fileFinder.init();

      expect(mockedReadFile).toHaveBeenCalledWith(vscode.Uri.file('testFile.ts'));
      expect(fileFinder.searchedSelector).toEqual('<app-test');
      expect(result).toEqual([]);
    });
  });

  describe('findFiles', () => {
    it('should find files that match the component selector', async () => {
      const fileFinder = new FileFinder('testFile.ts', '/project', '**/*.ts');

      const mockHelperFindIndexAll = jest.spyOn(Helper, 'findIndexAll').mockReturnValue([0]);
      fileFinder.searchedSelector = '<app-test';

      mockedGlob.mockResolvedValue(['file1.ts', 'file2.ts']);
      mockedPathJoin.mockImplementation((roothPath, file) => `/project/${file}`);

      mockedReadFile.mockResolvedValue(Buffer.from(`<app-test id="1">\nother content\n</app-test>`));

      const result = await fileFinder['findFiles']();
      expect(mockedReadFile).toHaveBeenCalledTimes(2);
      expect(mockHelperFindIndexAll).toHaveBeenCalledWith(expect.any(Array), '<app-test');

      const expectedFoundFiles = [
        { path: '/project/file1.ts', lines: ['<app-test id="1">'], lineNumber: [0] },
        { path: '/project/file2.ts', lines: ['<app-test id="1">'], lineNumber: [0] }
      ];

      expect(result).toEqual(expectedFoundFiles);
    });
  });
});