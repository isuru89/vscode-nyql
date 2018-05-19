import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import nySettings from "../nySettings";
import nyClient from "../client/nyClient";
import { filenameWithouExt } from "../utils";
import { connectForNyQL } from "./connectToNyQL";

const Win = vscode.window;

export async function getParsedResult() {
  if (Win.activeTextEditor) {
    const textEditor = Win.activeTextEditor;
    if (textEditor.document && textEditor.document.isDirty) {
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
    if (!nySettings.getActiveNyConnection()) {
      const uresult = await Win.showWarningMessage('You have not connected to a database yet!\nDo you want to connect now?',
        'Yes', 'No');
      if (uresult === 'Yes') {
        await connectForNyQL();
      } else {
        return;
      }
    }

    let result = await getParsedResult();
    console.log(result);
    parseScriptAndShow(result, Win.activeTextEditor);
  } catch (err) {
    nySettings.parsedWebView.updateError(err).activate();
  }
}

export async function parseScriptAndShow(result, txtEditor: vscode.TextEditor) {
  if (result) {
    const fullFile = txtEditor.document.fileName;
    const fn = filenameWithouExt(fullFile);
    result.file = fullFile;
    console.log(result);
    nySettings.parsedWebView.update(result, 'Parsed: ' + fn).activate();
  }
}