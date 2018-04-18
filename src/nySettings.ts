
import * as vscode from "vscode";

import nyDb from "./nyDb";

class NySettings {

  private scriptsDir: string;
  private db;

  constructor() {
    this.scriptsDir = vscode.workspace.rootPath;
    this.db = nyDb;
  }

  getDb() {
    return this.db;
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