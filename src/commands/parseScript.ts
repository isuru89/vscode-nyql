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
       "Yes", "No");
       if (response !== "Yes") {
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
      root: baseScriptsDir,
      file: activeDocFullPath,
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
    let result = await getParsedResult();
    if (result) {
      const fullFile = Win.activeTextEditor.document.fileName;
      const fn = filenameWithouExt(fullFile);
      result.file = fullFile;
      console.log(result);
      nySettings.parsedWebView.update(result, 'Parsed: ' + fn).activate();
    }
  } catch (err) {
    nySettings.parsedWebView.updateError(err).activate();
  }
}