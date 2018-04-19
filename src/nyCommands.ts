import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

const Win = vscode.window;

import nySettings from "./nySettings";
import { NyConnection } from "./nyModel";

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

export async function removeNyQLConnection() {
  const names = nySettings.getAllNyConnections(true).map(nc => nc.name);
  const picked = await Win.showQuickPick(names);
  if (picked) {
    nySettings.removeNyConnection(picked);
  }
}

export async function createNewNyQLConnection() {
  let name = await Win.showInputBox({ prompt: 'Enter a name for new NyQL connection' });
  const dialect = await Win.showQuickPick(['MySQL']);
  const host = await Win.showInputBox({ prompt: 'Host machine name or ip address' });
  const port = await Win.showInputBox({ prompt: 'Port of the ' + dialect + ' service', value: "3306" });
  const user = await Win.showInputBox({ prompt: 'Username for the database' });
  const pw = await Win.showInputBox({ prompt: 'Password for the database. Keep empty if no password is needed.', password: true });
  const dbName = await Win.showInputBox({ prompt: 'Schema name to connect for.'});

  if (!name) {
    name = host + "/" + dbName;
  }
  const nycon: NyConnection = {
    name: name,
    host: host,
    port: parseInt(port),
    dialect: dialect,
    username: user,
    password: pw,
    databaseName: dbName
  } as NyConnection;
  nySettings.addNyConnection(nycon);
}

function _toAbsDir(v: string) {
  let dir = v || vscode.workspace.rootPath;
  if (!path.isAbsolute(dir)) {
    dir = path.join(vscode.workspace.rootPath, v);
  }
  return dir;
}
