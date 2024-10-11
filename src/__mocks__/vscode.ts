const vscode = {
  TreeItem: class {
    constructor(public label: string) { }
  },
  TreeItemCollapsibleState: {
    None: "",
    Expanded: ""
  },
  workspace: {
    fs: {
      readFile: jest.fn().mockResolvedValue(Buffer.from('mock file content')),
    },
  },
  Uri: {
    file: jest.fn((path: string) => ({ fsPath: path })),
  },
  EventEmitter: class {
    constructor() { }
    fire(){

    }
  },
  Event: ()=>{},
  ThemeIcon: class {
    constructor(icon: string) {
      
     }
  },
};

export default vscode;
