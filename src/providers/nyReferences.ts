import * as vscode from "vscode";

import nySettings from "../nySettings";
import nyClient from "../client/nyClient";

export class NyReferenceProvider implements vscode.ReferenceProvider {

  provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Location[]> {
    try {
      if (document) {
        return new Promise((resolve, reject) => {
          token.onCancellationRequested(() => resolve(null));
          
          nyClient.sendMessage({
            cmd: 'refs',
            root: nySettings.scriptsDir,
            file: document.fileName
          }).then(result => {
            const arr = result as any[];
            const locations = arr.map(l => new vscode.Location(vscode.Uri.file(l.call), 
                new vscode.Position(l.line - 1, l.offset - 1)));
            resolve(locations);
          }).catch(err => reject(err));
        })
      }
    } catch (err) {
      vscode.window.showErrorMessage('Failed to find references for this file!');
    }
  }

}