import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

const Win = vscode.window;

import nySettings from "./nySettings";
import nyClient from "./client/nyClient";
import { filenameWithouExt } from "./utils";
import { NyConnection } from "./nyModel";

function openHtml(htmlUri: vscode.Uri, outputName: string, viewColumn: vscode.ViewColumn = vscode.ViewColumn.Two) {
  //let viewColumn: vscode.ViewColumn = vscode.ViewColumn.Two;
  //if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.viewColumn) {
    //viewColumn = vscode.window.activeTextEditor.viewColumn;
    //console.log(vscode.window.activeTextEditor.document.fileName);
  //}
  vscode.commands.executeCommand('vscode.previewHtml', htmlUri, viewColumn, outputName).then(success => {
  }, err => console.error(err))
}

export async function executeScript() {
  if (Win.activeTextEditor) {
    nySettings.previewHtml.update(nySettings.previewUri.with({ fragment: '/execute' }));
    openHtml(nySettings.previewUri.with({ fragment: '/execute' }), '/execute', vscode.ViewColumn.Three);
  }
}

export async function parseScript() {
  if (Win.activeTextEditor) {
    //nySettings.previewHtml.update(Win.activeTextEditor.document.uri);
    openHtml(nySettings.previewUri, '/query' );
  }
}

export async function getParsedResult() {
  if (Win.activeTextEditor) {
  const activeDocFullPath = Win.activeTextEditor.document.uri.fsPath;
  const baseScriptsDir = nySettings.getScriptsDir();
  let relPath = path.relative(baseScriptsDir, activeDocFullPath);
  const pos = relPath.lastIndexOf('.');
  if (pos > 0) {
    relPath = relPath.substr(0, pos).toLowerCase();
  }

  const result = await nyClient.sendMessage({
    cmd: 'parse',
    name: nySettings.getActiveNyConnection().name,
    path: relPath
  });
  console.log(result);
  return result;
} else {
  return 'No active text editor selected!'
}
}

export async function reloadSchema() {
  await nySettings.reloadSchema();
}

export async function connectForNyQL() {
  const names = nySettings.getAllNyConnections(true).map(nc => nc.name);
  const pickedName = await Win.showQuickPick(names);
  if (pickedName) {
    const picked = nySettings.getAllNyConnections().filter(nc => nc.name === pickedName);
    if (picked.length > 0) {
      await nySettings.refreshDb(picked[0]);
      Win.showInformationMessage(`Successfully connected to ${picked[0].name}.`);
    }
  }
}

export async function setRootScriptDir() {
  const rootDir = await Win.showInputBox({
    ignoreFocusOut: true,
    placeHolder: "Relative path to the workspace directory.",
    prompt: `Specify root scripts folder. [Current: ${nySettings.getScriptsDir()}]`,
    validateInput: v => {
      let dir = _toAbsDir(v);
      fs.existsSync(dir)
        ? "Given directory does not exist! [" + dir + "]"
        : null;
    }
  } as vscode.InputBoxOptions);

  if (rootDir) {
    let wsroot = vscode.workspace.rootPath;
    let dir = _toAbsDir(rootDir);
    nySettings.setScriptsDir(dir);
    Win.showInformationMessage("NyQL script directory set to: \n" + dir);
  }
}

export async function setDefaultConnection() {
  const names = nySettings.getAllNyConnections(true).map(nc => nc.name);
  const pickedName = await Win.showQuickPick(names);
  if (pickedName) {
    await nySettings.setDefaultConnection(pickedName);
    Win.showInformationMessage(`Default connection set to ${pickedName}.`);
  }
}

export async function removeNyQLConnection() {
  const names = nySettings.getAllNyConnections(true).map(nc => nc.name);
  const picked = await Win.showQuickPick(names);
  if (picked) {
    if (nySettings.removeNyConnection(picked)) {
      Win.showInformationMessage(`Successfully removed connection ${picked}!`);
    }
  }
}

export async function createNewNyQLConnection() {
  let name = await Win.showInputBox({ prompt: 'Enter a name for new NyQL connection' });
  const dialect = await Win.showQuickPick(['MySQL']);
  if (!dialect) {
    Win.showInformationMessage('You cancelled the NyQL connection creation!');
    return;
  }
  const host = await Win.showInputBox({ prompt: 'Host machine name or ip address' });
  if (!host) {
    Win.showInformationMessage('You cancelled the NyQL connection creation!');
    return;
  }
  const port = await Win.showInputBox({ prompt: 'Port of the ' + dialect + ' service', value: "3306" });
  const user = await Win.showInputBox({ prompt: 'Username for the database' });
  const pw = await Win.showInputBox({ prompt: 'Password for the database. Keep empty if no password is needed.', password: true });
  
  let nameFlag: boolean = false;
  if (!name) {
    name = host + "/";
    nameFlag = true;
  }
  const nycon: NyConnection = {
    name: name,
    host: host,
    port: parseInt(port),
    dialect: dialect,
    username: user,
    password: pw
  } as NyConnection;

  try {
    const dbNames = await nySettings.getDb().loadDatabaseNames(nycon);
    const dbName = await Win.showQuickPick(dbNames);
    nycon.databaseName = dbName;
    if (nameFlag) nycon.name = nycon.name + dbName;
    const addedCon = nySettings.addNyConnection(nycon);
    const reply = await Win.showInformationMessage(`Successfully added new NyQL connection ${addedCon.name}.`, 
      'Connect Now', 'Later');
    if (reply === 'Connect Now') {
      await nySettings.refreshDb(addedCon);
      Win.showInformationMessage(`Successfully connected to ${addedCon.name}.`);
    }

  } catch (err) {
    const e = err as Error;
    console.error(e);
    Win.showErrorMessage(`Server connection failed! [${nycon.host}] : ` + e.message);
  }
}

function _toAbsDir(v: string) {
  let dir = v || vscode.workspace.rootPath;
  if (!path.isAbsolute(dir)) {
    dir = path.join(vscode.workspace.rootPath, v);
  }
  return dir;
}
