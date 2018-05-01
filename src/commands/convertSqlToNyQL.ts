import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import { replaceText } from "../utils";
import nyClient from "../client/nyClient";
const Win = vscode.window;

export async function convertSqlToNyQL() {
  if (Win.activeTextEditor) {
    const editor = Win.activeTextEditor;
    const doc = editor.document;
    let payload = {
      cmd: 'convert'
    };

    let range = null;
      // unsaved document
      if (editor.selection) {
        range = new vscode.Range(editor.selection.start, editor.selection.end);
        payload['content'] = doc.getText(range);
      } else {
        if (doc.isUntitled) {
          payload['content'] = doc.getText();
        } else if (!doc.isDirty) {
          payload['file'] = doc.fileName;
        } else {
          Win.showWarningMessage('You need to select the query or save the document before converting to NyQL!')
        }
      }

    const result = await nyClient.sendMessage(payload);
    if (result.error) {
      Win.showErrorMessage('Failed to convert sql! [Error: ' + result.errorMessage + "]");
    } else if (result.warn) {
      Win.showErrorMessage('Unknown sql statement! Given query cannot be converted to nyql automatically!');
    } else {
      let dsl = (result.dsl as string).trim();
      if (dsl.startsWith('$DSL')) dsl = '\\' + dsl;
      replaceText(editor, dsl, range);
    }
  }

}
