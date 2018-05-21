import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import nySettings from "../nySettings";
import nyClient from "../client/nyClient";
import { fetchAllReqParams, readFileAsJson, createDataFile, filenameWithouExt,
  getMissingParameters, createSnippetParams, replaceText } from "../utils";
import { getParsedResult, parseScriptAndShow } from "./parseScript";
import { connectForNyQL } from "./connectToNyQL";
import { validUri } from "./utils";

const Win = vscode.window;

export async function executeScript(uri: vscode.Uri = null) {
  if (!nySettings.getActiveNyConnection()) {
    const uresult = await Win.showWarningMessage('You have not connected to a database yet!\nDo you want to connect now?',
      'Yes', 'No');
    if (uresult === 'Yes') {
      await connectForNyQL();
    } else {
      return;
    }
  }

  const txtEditor = Win.activeTextEditor;
  let fsPath = null;
  let parsedResult = null;
  if (uri) {
    fsPath = uri.fsPath;
    parsedResult = await getParsedResult(uri);
  } else if (txtEditor && txtEditor.document.languageId === 'nyql') {
    fsPath = txtEditor.document.fileName;
    parsedResult = await getParsedResult();
  } else {
    Win.showErrorMessage('Select a file from explorer or open a file in editor and then try again!');
    return;
  }

    if (parsedResult.parsable === false) {
      parseScriptAndShow(parsedResult, txtEditor, uri);
      return;
    }
    //parseScriptAndShow(parsedResult, txtEditor, uri);
    const reqParams = fetchAllReqParams(parsedResult);

    if (reqParams && reqParams.length > 0) {
      console.log(reqParams);
      parseScriptAndShow(parsedResult, txtEditor, uri);
      return;
    }

    // now we are ok to run query
    const result = await getExecutedResult(txtEditor, uri);
    const title = 'Executed: ' + filenameWithouExt(fsPath);
    nySettings.execWebView.update(result, title).activate();
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
    return Promise.reject('Invalid json data!');
  }

  if (!dataObj) {
    return Promise.reject('Invalid json data!');
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
async function getExecutedResult(textEditor: vscode.TextEditor, uri: vscode.Uri = null) {
  let fsPath = null;

  if (validUri(uri) && uri.fsPath) {
    fsPath = uri.fsPath;
  } else if (textEditor) {
    fsPath = textEditor.document.fileName;
  } 
  
  if (fsPath) {
    const data = readFileAsJson(fsPath + '.json');

    const result = await getExecutedResultWithData(fsPath, data);
    // console.log(result);
    return result;
  }
  return null;
}
