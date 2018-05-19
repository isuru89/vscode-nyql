import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import nySettings from "../nySettings";
import nyClient from "../client/nyClient";
import { filenameWithouExt } from "../utils";
import { connectForNyQL } from "./connectToNyQL";
import { validUri } from "./utils";

const Win = vscode.window;

export async function getParsedResult(uri: vscode.Uri = null) {
  let fsPath = null;
  if (validUri(uri)) {
    console.log('Invoking from uri...', uri.fsPath);
    fsPath = uri.fsPath;
  } else if (Win.activeTextEditor) {
    const textEditor = Win.activeTextEditor;
    if (textEditor.document && textEditor.document.isDirty) {
      const response = await Win.showInformationMessage("You have unsaved changes in this file! Do you want to save and parse the query?",
       "Yes", "No");
       if (response !== "Yes") {
         return;
       }
    }
    fsPath = textEditor.document.fileName;
  }

  if (fsPath) {
    const result = await parseAndGet(fsPath);
    return result;
  }
  return null;
}

function parseAndGet(fsPath: string) {
  const baseScriptsDir = nySettings.scriptsDir;
    let relPath = path.relative(baseScriptsDir, fsPath);
    const pos = relPath.lastIndexOf('.');
    if (pos > 0) {
      relPath = relPath.substr(0, pos);
    }

    return nyClient.sendMessage({
      cmd: 'parse',
      root: baseScriptsDir,
      file: fsPath,
      name: nySettings.getActiveNyConnection().name,
      path: relPath
    });
}

export async function parseScript(uri: vscode.Uri = null) {
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

    let result = await getParsedResult(uri);
    console.log(result);
    parseScriptAndShow(result, Win.activeTextEditor, uri);
  } catch (err) {
    nySettings.parsedWebView.updateError(err).activate();
  }
}

export function parseScriptAndShow(result, txtEditor: vscode.TextEditor = null, uri: vscode.Uri = null) {
  if (result) {
    let fullFile = null;
    if (uri) {
      fullFile = uri.fsPath;
    } else if (txtEditor) {
      fullFile = txtEditor.document.fileName;
    }  
    const fn = filenameWithouExt(fullFile);
    result.file = fullFile;
    console.log(result);
    nySettings.parsedWebView.update(result, 'Parsed: ' + fn).activate();
  }
}