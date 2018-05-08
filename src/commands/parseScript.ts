import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import nySettings from "../nySettings";
import nyClient from "../client/nyClient";
import { filenameWithouExt } from "../utils";

const Win = vscode.window;

export async function getParsedResult() {
  if (Win.activeTextEditor) {
    const textEditor = Win.activeTextEditor;
    if (textEditor.document.isDirty) {
      const response = await Win.showInformationMessage("You have unsaved changes in this file! Do you want to save and parse the query?",
       "yes", "no");
       if (response !== "yes") {
         return;
       }
    }
    const activeDocFullPath = textEditor.document.fileName;
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
  try {
    const result = await getParsedResult();
    if (result) {
      const fn = filenameWithouExt(Win.activeTextEditor.document.fileName);
      nySettings.parsedWebView.update(result, 'Parsed: ' + fn).activate();
    }
  } catch (err) {
    nySettings.parsedWebView.updateError(err).activate();
  }
}