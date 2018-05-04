import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import nySettings from "../nySettings";
import nyClient from "../client/nyClient";
import { fetchAllReqParams, readFileAsJson, createDataFile,
  getMissingParameters, createSnippetParams, replaceText } from "../utils";
import { openHtml } from "./utils";
import { getParsedResult, parseScript } from "./parseScript";

const Win = vscode.window;

// @TODO parameterize this so query can execute when json file is activated
// @TODO check file save status and warn user
export async function executeScript() {
  if (Win.activeTextEditor && Win.activeTextEditor.document.languageId === 'nyql') {
    const parsedResult = await getParsedResult();
    await parseScript();
    const reqParams = fetchAllReqParams(parsedResult);

    if (reqParams && reqParams.length > 0) {
      // parameters required...
      const filename = createDataFile(Win.activeTextEditor.document.fileName + '.json');
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
    nySettings.previewHtml.update(nySettings.executeUri);
    await openHtml(nySettings.executeUri, 'Execute', vscode.ViewColumn.Three);
  }
}

export async function getExecutedResult() {
  if (Win.activeTextEditor) {
    const activeDocFullPath = Win.activeTextEditor.document.fileName;
    const baseScriptsDir = nySettings.scriptsDir;
    let relPath = path.relative(baseScriptsDir, activeDocFullPath);
    const pos = relPath.lastIndexOf('.');
    if (pos > 0) {
      relPath = relPath.substr(0, pos).toLowerCase();
    }
    const data = readFileAsJson(activeDocFullPath + '.json');

    const result = await nyClient.sendMessage({
      cmd: 'execute',
      name: nySettings.getActiveNyConnection().name,
      path: relPath,
      data: data
    });
    console.log(result);
    return result;
  } else {
    return null;
  }
}
