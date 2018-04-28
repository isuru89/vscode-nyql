
import * as vscode from "vscode";
import * as path from "path";

import { NyConnection } from "./nyModel";
import {NyQLDatabaseConnection} from "./nyDb";

import nyClient from "./client/nyClient";
import { NyQLViewHtml } from "./providers/parsedQueryView";


const preview = new NyQLViewHtml(vscode.Uri.parse(`nyql://engine`));

class NySettings implements vscode.Disposable {

  private configs: vscode.WorkspaceConfiguration;
  private scriptsDir: string;
  private db: NyQLDatabaseConnection;
  private statusBar: vscode.StatusBarItem;
  private activeConnection: NyConnection;

  constructor() {
    this.configs  = vscode.workspace.getConfiguration('nyql');
    if (this.configs.has('scriptsRootDir')) {
      this.scriptsDir = path.join(vscode.workspace.rootPath, this.configs.get('scriptsRootDir'));
    } else {
      this.scriptsDir = vscode.workspace.rootPath;
    }
    this.db = new NyQLDatabaseConnection();
  }

  getPreviewHtml(): NyQLViewHtml {
    return preview;
  }

  getNyStatusBar(): vscode.StatusBarItem {
    if (this.statusBar) {
      return this.statusBar;
    }

    const count = this.getAllNyConnections().length;
    this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
    this.refreshStatusText();
    this.statusBar.tooltip = count > 0 ? 'Select NyQL connection' : 'Create new NyQL connection';
    //this.statusBar.text = count > 0 ? '$(database) <Select NyQL connection>' : '$(database) <Create NyQL connection>';
    if (count === 0) {
      this.statusBar.command = 'nyql.createNewNyQLConnection';
    } else {
      this.statusBar.command = 'nyql.connectForNyQL';
    }
    return this.statusBar;
  }

  private refreshStatusText(text?: string) {
    if (text) {
      this.statusBar.text = text;
    } else {
      if (this.activeConnection) {
        this.statusBar.text = '$(database) NyQL: ' + this.activeConnection.name; 
      } else {
        const count = this.getAllNyConnections().length;
        this.statusBar.text = count > 0 ? '$(database) <Select NyQL Connection>' : '$(database) <Create NyQL Connection>';
        this.statusBar.tooltip = `Select NyQL Connection. (#${count} connections available)`;
      }
    }
  }

  dispose() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  getDefaultConnection(): NyConnection {
    const name = this.configs.get('defaultConnection');
    if (name) {
      const filtered = this.getAllNyConnections().filter(cn => cn.name === name);
      if (filtered.length > 0) {
        return filtered[0];
      }
    } else {
      const alls = this.getAllNyConnections();
      if (alls.length === 1) {
        return alls[0];
      }
    }
    return null;
  }

  async setDefaultConnection(cnName: string) {
    if (cnName) {
      await this.configs.update('defaultConnection', cnName); 
    }
  }

  getActiveNyConnection() : NyConnection {
    return this.activeConnection;
  }

  async reloadSchema() {
    if (this.activeConnection) {
      this.statusBar.command = null;
      this.statusBar.text = '$(database) NyQL: Reloading...';
      await this.db.loadSchema();
      this.statusBar.text = '$(database) NyQL: ' + this.activeConnection.name
      this.statusBar.command = 'nyql.connectForNyQL';
    }
  }

  async refreshDb(con: NyConnection, force: boolean = false) { 
    if (!force && this.activeConnection && this.activeConnection.name === con.name) {
      // no need to refresh. this is same connection
      return null;
    }

    this.statusBar.command = null;
    this.statusBar.text = '$(database) NyQL: Connecting...'
    this.activeConnection = con;
    await this.db.close();
    await this.db.reloadConnection(con);
    await this.db.loadSchema();
    await nyClient.sendMessage({
      cmd: 'con',
      scriptDir: this.scriptsDir,
      ...con
    });
    this.refreshStatusText();
    this.statusBar.command = 'nyql.connectForNyQL';
    return con;
  }

  getDb() {
    return this.db;
  }

  getScriptsDir(): string {
    return this.scriptsDir;
  }

  setScriptsDir(scriptsDir: string) {
    this.scriptsDir = scriptsDir;
    const relPath = path.relative(vscode.workspace.rootPath, this.scriptsDir);
    if (relPath.startsWith('..')) {
      // a script folder outside workspace
      this.configs.update('scriptsRootDir', this.scriptsDir);
    } else {
      this.configs.update('scriptsRootDir', relPath);
    }
  }

  removeNyConnection(connName: string): boolean {
    let allConns = this.getAllNyConnections();
    const idx = allConns.findIndex(nyc => nyc.name === connName);
    if (idx >= 0) {
      allConns.splice(idx, 1);
      this.configs.update('connections', allConns);
      return true;
    } else {
      return false;
    }
  }

  getAllNyConnections(exceptCurrentOne: boolean = false): Array<NyConnection> {
    const alls: Array<NyConnection> = this.configs.get('connections');
    if (exceptCurrentOne) {
      if (this.activeConnection) {
        return alls.filter(c => c.name !== this.activeConnection.name);
      } 
    }
    return alls;
  }

  addNyConnection(con: NyConnection): NyConnection {
    let conns = this.configs.get('connections') as Array<NyConnection>;
    if (this._validateCon(con)) {
      conns.push(con);
      this.configs.update('connections', conns);
      this.refreshStatusText();
    }
    return con;
  }

  private _validateCon(con: NyConnection): boolean {
    if (con) {
      if (!con.name) return false;
      if (!con.host) return false;
      if (!con.port) return false;
      if (!con.dialect) return false;
      return true;
    } else {
      return false;
    }
  }
} 

const instance = new NySettings();

export default instance;