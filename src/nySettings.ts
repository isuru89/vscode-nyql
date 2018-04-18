
import * as vscode from "vscode";

class NySettings {

  private scriptsDir: string;

  constructor() {
    this.scriptsDir = vscode.workspace.rootPath;
  }

  getScriptsDir(): string {
    return this.scriptsDir;
  }

  setScriptsDir(scriptsDir: string) {
    this.scriptsDir = scriptsDir;
  }

} 

const instance = new NySettings();

export default instance;