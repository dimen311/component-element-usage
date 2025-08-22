import * as vscode from 'vscode';
import * as path from 'path';
import { glob } from 'glob';
import * as fs from 'fs';

interface ComponentUsage {
    file: string;
    lines: number[];
}

interface ComponentInfo {
    componentFile: string;
    templateFile?: string | null;
    usages: ComponentUsage[];
}

interface ComponentIndex {
    [selector: string]: ComponentInfo;
}

export class ComponentIndexManager {
    private static readonly INDEX_FILE = '.angular-component-index.json';
    private static readonly IGNORE_PATTERNS = [
        'node_modules/**',
        'dist/**',
        'out/**',
        'e2e/**',
        '.angular/**',
        '.vscode/**',
        '.claude/**',
        '.gemini/**',
        'coverage/**',
        'public/**',
        'assets/**',
        '.git/**',
        '**/*.test.ts',
        '**/*.spec.ts'
    ];

    private readonly indexPath: string;
    private readonly rootPath: string;
    private readonly storagePath: string;
    private index: ComponentIndex = {};
    private isIndexRunning: boolean = false;
    public isIndexBuilt: boolean = false;

    constructor(rootPath: string, context: vscode.ExtensionContext) {
        this.rootPath = rootPath;
        this.storagePath = context.globalStorageUri.fsPath;
        this.indexPath = path.join(this.storagePath, ComponentIndexManager.INDEX_FILE);

        // Create storage directory if it doesn't exist
        if (!fs.existsSync(this.storagePath)) {
            fs.mkdirSync(this.storagePath, { recursive: true });
        }
        this.loadIndex();
        this.isIndexBuilt = Object.keys(this.index).length > 0;
    }

    private loadIndex(): void {
        try {
            if (fs.existsSync(this.indexPath)) {
                this.index = JSON.parse(fs.readFileSync(this.indexPath, 'utf8'));
            }
        } catch (error) {
            console.error('Failed to load index:', error);
            this.index = {};
        }
    }

    private saveIndex(): void {
        try {
            fs.writeFileSync(this.indexPath, JSON.stringify(this.index, null, 2));
        } catch (error) {
            console.error('Failed to save index:', error);
        }
    }

    private normalizePath(filePath: string): string {
        return filePath.replace(/\\/g, '/');
    }

    private async collectComponentSelectors(files: string[]): Promise<void> {
        for (const file of files) {
            if (file.endsWith('.ts')) {
                const filePath = path.join(this.rootPath, file);
                const content = await this.readFile(filePath);

                // Extract component selector
                const selector = this.extractComponentSelector(content);
                const templateUrl = this.extractTemplateUrlFromComponent(content);
                const templatePath = templateUrl ? this.normalizePath(path.join(path.dirname(file), templateUrl)) : null;
                if (selector) {
                    this.index[selector] = {
                        componentFile: this.normalizePath(file),
                        templateFile: templatePath,
                        usages: []
                    };
                }
            }
        }
    }

    private async findComponentUsagesInFiles(files: string[]): Promise<void> {
        for (const file of files) {
            if (file.endsWith('.html')) {
                const filePath = path.join(this.rootPath, file);
                const content = await this.readFile(filePath);
                this.updateTemplateUsages(this.normalizePath(file), content);
            } else if (file.endsWith('.ts')) {
                const filePath = path.join(this.rootPath, file);
                const content = await this.readFile(filePath);
                const selectorsFromTemplate = this.extractComponentFromTemplate(content);
                if (selectorsFromTemplate) {
                    this.updateTemplateUsages(file, selectorsFromTemplate);
                }
            }
        }
    }

    public async buildIndex(): Promise<void> {
        if (this.isIndexRunning) {
            return;
        }
        this.isIndexRunning = true;

        try {
            // Find all component files
            const componentFiles = await glob('**/*.{ts,html}', {
                cwd: this.rootPath,
                ignore: ComponentIndexManager.IGNORE_PATTERNS,
            });

            this.index = {};

            // First pass: collect all component selectors
            await this.collectComponentSelectors(componentFiles);

            // Second pass: find usages in HTML files
            await this.findComponentUsagesInFiles(componentFiles);

            this.saveIndex();
        } finally {
            this.isIndexRunning = false;
        }
    }

    private async readFile(filePath: string): Promise<string> {
        const content = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
        return Buffer.from(content).toString('utf8');
    }

    private extractComponentSelector(content: string): string | null {
        const regex = /@Component\(\s*{[^}]*?\bselector:\s*'([^']*)'/;
        const match = content.match(regex);
        return match ? match[1] : null;
    }

    private extractComponentFromTemplate(content: string): string | null {
        const regex = /@Component\s*\(\s*\{[^}]*template\s*:\s*['"`]([^'"`]*)['"`][^}]*\}\s*\)/;
        const match = content.match(regex);
        return match ? match[1] : null;
    }

    private extractTemplateUrlFromComponent(content: string): string | null {
        const regex = /@Component\(\s*{[^}]*?\btemplateUrl:\s*'([^']*)'/;
        const match = content.match(regex);
        return match ? match[1] : null;
    }


    private updateTemplateUsages(file: string, content: string): void {
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            for (const selector of Object.keys(this.index)) {
                const lines = new Set<number>();
                const selectorNode = this.index[selector];

                const tagRegex = new RegExp(`<\\s*${selector}(?=\\s|\\/|>)`, 'i');
                if (tagRegex.test(line)) {
                    lines.add(index + 1);
                }

                if (lines.size > 0) {
                    const existingUsage = selectorNode.usages.find(u => u.file === file);
                    if (existingUsage) {
                        existingUsage.lines = Array.from(new Set([...existingUsage.lines, ...lines]));
                    } else {
                        selectorNode.usages.push({ file, lines: Array.from(lines) });
                    }
                }
            }
        });
    }

    public findComponentUsages(selector: string): ComponentUsage[] {
        return this.index[selector]?.usages || [];
    }

    public getComponentByTemplatePath(filePath: string) {
        const normalizedPath = this.normalizePath(path.relative(this.rootPath, filePath));
        for (const selector in this.index) {
            if (this.index[selector].templateFile === normalizedPath) {
                const componentFile = this.index[selector].componentFile;
                // return The file system path of the associated resource. Shorthand notation for TextDocument.uri.fsPath. Independent of the uri scheme.
                return path.join(this.rootPath, componentFile);

            }
        }
        return '';
    }
} 