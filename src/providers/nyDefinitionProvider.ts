import * as vscode from "vscode";
import nySettings from "../nySettings";
import { join } from "path";
import { existsSync } from "fs";
import nyClient from "../client/nyClient";

export class NyDefinitionProvider implements vscode.DefinitionProvider {
  provideDefinition(document: vscode.TextDocument, position: vscode.Position, 
    token: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition> {
    if (!document) {
      return;
    }

    let lineText = document.lineAt(position.line).text;
    let lineTill = lineText.substr(0, position.character);
    let lineAfter = lineText.substr(position.character);

    const ppos = Math.max(lineTill.lastIndexOf('\"'), lineTill.lastIndexOf("'"), 0);
    const prfx = lineTill.substring(0, ppos).trim();
    const ppath = lineTill.substring(ppos+1);

    if (/\bTABLE\s*\(\s*['\"]?/g.exec(prfx)) {
      return;
    }
    if (!/\b\$?(IMPORT|RUN|IMPORT_SAFE)\s*\(\s*/g.exec(prfx)) {
      return;
    }

    let relPath = "";
    if (ppos > 0) {
      let ep = lineAfter.indexOf('\"');
      if (ep <= ppos) {
        ep = lineAfter.indexOf("'");
      }
      
      if (ep > ppos) {
        relPath = lineAfter.substr(0, ep);
      }
    }

    const f = join(nySettings.scriptsDir, ppath + relPath);
    let path;
    if (existsSync(f + '.groovy')) {
      path = f + '.groovy';
    } else if (existsSync(f + '.nyql')) {
      path = f + '.nyql';
    } else {
      return;
    }
    
    // return nyClient.sendMessage({
    //   cmd: 'linecount',
    //   file: path
    // }).then(result => {
      return Promise.resolve(new vscode.Location(vscode.Uri.file(path), 
        new vscode.Position(0, 0)
        // new vscode.Range(new vscode.Position(0, 0), new vscode.Position(result.lines - 1, 0))
      ));
    // });
  }
}