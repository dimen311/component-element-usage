# Angular Component Usage Finder

## Overview

<h1 align="center">

 VS CODE - Angular Component Usage Finder

  <br>
  <br>
</h1>

**Angular Component Usage Finder** is a Visual Studio Code extension that helps you quickly find the usage of Angular components within your project's HTML templates. Simply right-click on an Angular component and select "Find Component Usages" to locate where it's used across your project.


  <br>
    <img src="https://github.com/dimen311/shared_folder/blob/main/angularComponentElementUsage.gif?raw=true" alt="logo" width="100%">
  <br>

## Usage

1. Open any Angular project in Visual Studio Code.
2. In the HTML file, right-click on a component tag you wish to find.
3. Select **Find Component Usages** from the context menu.
4. The extension will search through your project’s HTML templates and display all occurrences of the component under explorer: Element usage explorer.


## Features

- Quickly find Angular component usage in HTML templates.
- Seamlessly integrated into the VS Code right-click context menu.
- Supports projects using the Angular framework.
  
## Installation

1. Open Visual Studio Code.
2. Go to the Extensions view by clicking on the Extensions icon in the Activity Bar on the side of the window or pressing `Ctrl+Shift+X`.
3. Search for **Angular Component Usage Finder**.
4. Click **Install**.

Alternatively, you can manually install the extension by downloading it from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/).

## Requirements

- An Angular project with properly structured templates.
- Visual Studio Code version 1.60.0 or later.

## Known Issues

- **Dynamic Components**: The extension may not detect component usage in dynamic or conditional templates.
- **Large Projects**: Performance may slow down when scanning very large projects.

## Contributing

Contributions are welcome! If you'd like to contribute, please fork the repository and submit a pull request. For any issues or suggestions, please open a ticket on the [GitHub Issues page](https://github.com/your-repo).

## License

This extension is licensed under the [MIT License](https://opensource.org/licenses/MIT).
