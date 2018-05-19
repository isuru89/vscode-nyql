import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import nySettings from "../nySettings";
import nyClient from "../client/nyClient";
import { fetchAllReqParams, readFileAsJson, createDataFile, filenameWithouExt,
  getMissingParameters, createSnippetParams, replaceText } from "../utils";
import { getParsedResult, parseScriptAndShow } from "./parseScript";
import { connectForNyQL } from "./connectToNyQL";

const Win = vscode.window;

// @TODO parameterize this so query can execute when json file is activated
// @TODO check file save status and warn user
export async function executeScript() {
  if (!nySettings.getActiveNyConnection()) {
    const uresult = await Win.showWarningMessage('You have not connected to a database yet!\nDo you want to connect now?',
      'Yes', 'No');
    if (uresult === 'Yes') {
      await connectForNyQL();
    } else {
      return;
    }
  }

  const textEditor = Win.activeTextEditor;
  if (textEditor && textEditor.document.languageId === 'nyql') {
    const parsedResult = await getParsedResult();
    if (parsedResult.parsable === false) {
      parseScriptAndShow(parsedResult, textEditor);
      return;
    }
    await parseScriptAndShow(parsedResult, textEditor);
    const reqParams = fetchAllReqParams(parsedResult);

    if (reqParams && reqParams.length > 0) {
      // parameters required...
      const filename = createDataFile(textEditor.document.fileName + '.json');
      // read json file
      let jsonData = readFileAsJson(filename, null);
      if (!jsonData) {
        // no data
        const doc = await vscode.workspace.openTextDocument(filename);
        const editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.Two, true);
        vscode.window.showWarningMessage('You need some parameters to run this query!');
        replaceText(editor, createSnippetParams({}, reqParams.map(r => r.name)));
        return;
      } else {
        // check json data is enough to run query
        const missed: string[] = getMissingParameters(jsonData, reqParams);
        if (missed.length > 0) {
          // prompt user to insert missing params

          const doc = await vscode.workspace.openTextDocument(filename);
          const editor = await vscode.window.showTextDocument(doc, vscode.ViewColumn.Two, true);
          const snp = createSnippetParams(jsonData, missed);
          replaceText(editor, snp);
          return;
        } 
      }

    }

    // now we are ok to run query
    const result = await getExecutedResult(textEditor);
    const title = 'Executed: ' + filenameWithouExt(textEditor.document.fileName);
    nySettings.execWebView.update(result, title).activate();
  }
}

export async function getExecutedResultWithData(file:string, data) {
  let dataObj = null;
  try {
    if (typeof data === 'string') {
      dataObj = JSON.parse(data);
    } else {
      dataObj = data;
    }
  } catch (err) {
    Win.showErrorMessage("Invalid json data format given!");
    return Promise.reject('Invalid json data format');
  }

  const baseScriptsDir = nySettings.scriptsDir;
  let relPath = path.relative(baseScriptsDir, file);
  const pos = relPath.lastIndexOf('.');
  if (pos > 0) {
    relPath = relPath.substr(0, pos).toLowerCase();
  }

  return await Win.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Executing query...',
    cancellable: false
  }, (progress, token) => {
     return nyClient.sendMessage({
      cmd: 'execute',
      name: nySettings.getActiveNyConnection().name,
      path: relPath,
      data: dataObj
    });
  });
}

// @TODO remove duplicates
async function getExecutedResult(textEditor: vscode.TextEditor) {
  if (textEditor) {
    const activeDocFullPath = textEditor.document.fileName;
    const data = readFileAsJson(activeDocFullPath + '.json');

    const result = await getExecutedResultWithData(activeDocFullPath, data);
    // const result = await nyClient.sendMessage({
    //   cmd: 'execute',
    //   name: nySettings.getActiveNyConnection().name,
    //   path: relPath,
    //   data: data
    // });
    console.log(result);
    return result;
  } else {
    return null;
  }
}
