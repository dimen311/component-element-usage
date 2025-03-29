import { ComponentIndexManager } from './component-index';
import * as vscode from 'vscode';
import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('glob');
jest.mock('fs');
jest.mock('path');
jest.mock('vscode');

const mockedGlob = glob as jest.MockedFunction<typeof glob>;
const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedPath = path as jest.Mocked<typeof path>;

describe('ComponentIndexManager', () => {
    let indexManager: ComponentIndexManager;
    const workspaceRoot = '/test/workspace';
    const mockContext = {
        globalStorageUri: {
            fsPath: '/test/global-storage-path'
        }
    } as vscode.ExtensionContext;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock path.join
        (mockedPath.join as jest.Mock).mockImplementation((...args) => args.join('/'));

        // Mock fs functions
        mockedFs.existsSync.mockReturnValue(false);
        mockedFs.writeFileSync.mockImplementation(() => { });
        mockedFs.readFileSync.mockReturnValue('{}');
        mockedFs.mkdirSync.mockImplementation(() => '/test/global-storage-path');

        // Mock vscode.Uri
        (vscode.Uri as any) = {
            file: jest.fn().mockImplementation((filePath: string) => {
                return { fsPath: filePath } as vscode.Uri;
            }),
        };

        // Mock vscode.workspace.fs
        (vscode.workspace as any) = {
            fs: {
                readFile: jest.fn().mockResolvedValue(Buffer.from(''))
            }
        };

        indexManager = new ComponentIndexManager(workspaceRoot, mockContext);
    });

    describe('constructor', () => {
        it('should initialize with correct paths', () => {
            const manager = new ComponentIndexManager(workspaceRoot, mockContext);
            expect(manager['indexPath']).toBe('/test/global-storage-path/.angular-component-index.json');
        });

        it('should create storage directory if it does not exist', () => {
            mockedFs.existsSync.mockReturnValue(false);
            new ComponentIndexManager(workspaceRoot, mockContext);
            expect(mockedFs.mkdirSync).toHaveBeenCalledWith('/test/global-storage-path', { recursive: true });
        });
    });

    describe('buildIndex', () => {
        it('should build index from component files', async () => {
            const mockFiles = [
                'src/app/test.component.ts',
                'src/app/other.component.ts',
                'src/app/test.component.html',
                'src/app/other.component.html'
            ];

            const mockTsContent1 = `
                @Component({
                    selector: 'app-test'
                })
                export class TestComponent {}
            `;

            const mockTsContent2 = `
                @Component({
                    selector: 'app-other'
                })
                export class OtherComponent {}
            `;

            const mockHtmlContent1 = `
                <div>
                    <app-test></app-test>
                    <app-other></app-other>
                </div>
            `;

            const mockHtmlContent2 = `
                <div>
                    <app-test></app-test>
                </div>
            `;

            mockedGlob.mockResolvedValue(mockFiles);

            // Mock readFile implementation using Buffer
            (vscode.workspace.fs.readFile as jest.Mock)
                .mockResolvedValueOnce(Buffer.from(mockTsContent1))  // test.component.ts
                .mockResolvedValueOnce(Buffer.from(mockTsContent2))  // other.component.ts
                .mockResolvedValueOnce(Buffer.from(mockHtmlContent1)) // test.component.html
                .mockResolvedValueOnce(Buffer.from(mockHtmlContent2)); // other.component.html

            await indexManager.buildIndex();

            expect(mockedGlob).toHaveBeenCalledWith('**/*.{ts,html}', expect.any(Object));
            expect(vscode.workspace.fs.readFile).toHaveBeenCalledTimes(6);

            // Verify the index was saved with correct data
            expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('app-test')
            );
            expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('app-other')
            );
        });

        it('should handle files with no component selectors', async () => {
            const mockFiles = [
                'src/app/test.component.ts',
                'src/app/test.component.html'
            ];

            const mockTsContent = `
                // No component here
                export class TestComponent {}
            `;

            const mockHtmlContent = `
                <div>
                    <app-test></app-test>
                </div>
            `;

            mockedGlob.mockResolvedValue(mockFiles);

            // Mock readFile implementation
            (vscode.workspace.fs.readFile as jest.Mock)
                .mockResolvedValueOnce(Buffer.from(mockTsContent))
                .mockResolvedValueOnce(Buffer.from(mockHtmlContent));

            await indexManager.buildIndex();

            expect(vscode.workspace.fs.readFile).toHaveBeenCalledTimes(3);
            expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('{}')
            );
        });

        it('should extract component selectors from inline templates', async () => {
            const mockFiles = [
                'src/app/test.component.ts'
            ];

            const mockTsContent = `
                @Component({
                    selector: 'app-test',
                    template: '<div><app-other></app-other></div>'
                })
                export class TestComponent {}
            `;

            mockedGlob.mockResolvedValue(mockFiles);

            // Mock readFile implementation
            (vscode.workspace.fs.readFile as jest.Mock)
                .mockResolvedValueOnce(Buffer.from(mockTsContent));

            await indexManager.buildIndex();

            expect(vscode.workspace.fs.readFile).toHaveBeenCalledTimes(2);

            // Verify that both the component definition and template usage were processed
            const savedIndexContent = (mockedFs.writeFileSync.mock.calls[0][1] as string);
            const savedIndex = JSON.parse(savedIndexContent);

            // Check that app-test was indexed properly
            expect(savedIndex['app-test']).toBeDefined();
        });
    });

    describe('findComponentUsages', () => {
        it('should return component usages from index', () => {
            const mockIndex = {
                'app-test': {
                    componentFile: 'src/app/test.component.ts',
                    usages: [
                        {
                            file: 'src/app/other.component.html',
                            lines: [10, 20]
                        }
                    ]
                }
            };

            mockedFs.existsSync.mockReturnValue(true);
            mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockIndex));

            // Recreate index manager to load mock index
            indexManager = new ComponentIndexManager(workspaceRoot, mockContext);

            const usages = indexManager.findComponentUsages('app-test');
            expect(usages).toEqual(mockIndex['app-test'].usages);
        });

        it('should return empty array when component not found', () => {
            const mockIndex = {
                'app-test': {
                    componentFile: 'src/app/test.component.ts',
                    usages: []
                }
            };

            mockedFs.existsSync.mockReturnValue(true);
            mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockIndex));

            indexManager = new ComponentIndexManager(workspaceRoot, mockContext);

            const usages = indexManager.findComponentUsages('non-existent');
            expect(usages).toEqual([]);
        });

        it('should handle invalid index file', () => {
            // Suppress console.error for this test
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            mockedFs.existsSync.mockReturnValue(true);
            mockedFs.readFileSync.mockReturnValue('invalid json');

            indexManager = new ComponentIndexManager(workspaceRoot, mockContext);

            const usages = indexManager.findComponentUsages('app-test');
            expect(usages).toEqual([]);
            
            consoleSpy.mockRestore();
        });
    });

    describe('updateTemplateUsages', () => {
        it('should find multiple selectors in the same line', async () => {
            const mockFiles = [
                'src/app/test.component.ts',
                'src/app/other.component.ts',
                'src/app/test.component.html'
            ];

            const mockTsContent1 = `
                @Component({
                    selector: 'app-test'
                })
                export class TestComponent {}
            `;

            const mockTsContent2 = `
                @Component({
                    selector: 'app-other'
                })
                export class OtherComponent {}
            `;

            const mockHtmlContent = `
                <div>
                    <app-test><app-other></app-other></app-test>
                </div>
            `;

            mockedGlob.mockResolvedValue(mockFiles);

            // Mock readFile implementation
            (vscode.workspace.fs.readFile as jest.Mock)
                .mockResolvedValueOnce(Buffer.from(mockTsContent1))
                .mockResolvedValueOnce(Buffer.from(mockTsContent2))
                .mockResolvedValueOnce(Buffer.from(mockTsContent1))
                .mockResolvedValueOnce(Buffer.from(mockTsContent2))
                .mockResolvedValueOnce(Buffer.from(mockHtmlContent));

            await indexManager.buildIndex();

            // Verify that both selectors were found in the same line
            const savedIndexContent = mockedFs.writeFileSync.mock.calls[0][1] as string;
            const savedIndex = JSON.parse(savedIndexContent);
            expect(savedIndex['app-test'].usages[0].lines).toContain(3);
            expect(savedIndex['app-other'].usages[0].lines).toContain(3);
        });

        it('should handle malformed HTML content', async () => {
            const mockFiles = [
                'src/app/test.component.ts',
                'src/app/test.component.html'
            ];

            const mockTsContent = `
                @Component({
                    selector: 'app-test'
                })
                export class TestComponent {}
            `;

            const mockHtmlContent = `
                <div>
                    <app-test
                    <app-test
            `;

            mockedGlob.mockResolvedValue(mockFiles);

            // Mock readFile implementation
            (vscode.workspace.fs.readFile as jest.Mock)
                .mockResolvedValueOnce(Buffer.from(mockTsContent))
                .mockResolvedValueOnce(Buffer.from(mockHtmlContent));

            await indexManager.buildIndex();

            // Verify that malformed HTML doesn't crash the index building
            const savedIndexContent = mockedFs.writeFileSync.mock.calls[0][1] as string;
            const savedIndex = JSON.parse(savedIndexContent);
            expect(savedIndex['app-test']).toBeDefined();
        });
    });
});