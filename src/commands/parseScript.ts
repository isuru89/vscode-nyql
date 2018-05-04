import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import nySettings from "../nySettings";
import nyClient from "../client/nyClient";
import { openHtml } from "./utils";

const Win = vscode.window;

export async function getParsedResult() {
  if (Win.activeTextEditor) {
    const activeDocFullPath = Win.activeTextEditor.document.fileName;
    const baseScriptsDir = nySettings.scriptsDir;
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
    return null;
  }
}

export async function parseScript() {
  if (Win.activeTextEditor) {
    openHtml(nySettings.parseUri, 'Parsed' );
  }
}