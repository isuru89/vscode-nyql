import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as hb from "handlebars";

import { replaceQuery } from "../commands/replaceNyQL";
import { getExecutedResultWithData } from "../commands/executeScript";
import nySettings from "../nySettings";

const DEV = process.env['NYQL_VSCODE_DEV'] || false;

export class NyQLParsedView implements vscode.Disposable {

  private panel: vscode.WebviewPanel;
  private parsedHtml;
  private errorParseHtml;
  private extPath;

  constructor(context: vscode.ExtensionContext) {
    const extPath = context.extensionPath;
    this.extPath = extPath;
    if (!DEV) {
    this.parsedHtml = hb.compile(this.loadHtml(extPath, "parsed.html"));
    this.errorParseHtml = hb.compile(this.loadHtml(extPath, "error.html"));
    }

    this.initHb();
  }

  private initPanel() {
    if (this.panel) {
      return;
    }

    this.panel = vscode.window.createWebviewPanel('nyqlParseView', 
      'Parsed Query', 
      vscode.ViewColumn.Two, 
      { enableScripts: true, retainContextWhenHidden: true });
    this.panel.onDidDispose(e => this.panel = null);
    this.panel.webview.onDidReceiveMessage(msg => {
      if (msg.command === 'replace') {
        replaceQuery(msg).then(result => {
          console.log(result);
          this.updateReplaced(result.query);
        }).catch(err => {
          vscode.window.showErrorMessage("Failed to parse query! Reason: " + err.message);
        });
      } else if (msg.command === 'execute') {
        console.log(msg);
        const file = msg.file;
        getExecutedResultWithData(file, msg.data).then(result => {
          nySettings.execWebView.update(result).activate();
        }).catch(err => {
          vscode.window.showErrorMessage("Failed to execute query! Reason: " + err.message);
        })
      }
    });
  }

  private loadHtml(extPath: string, fileName: string): string {
    return fs
      .readFileSync(path.join(extPath, "src", "providers", fileName))
      .toString();
  }

  private initHb() {
    hb.registerHelper("get", function(obj, prop) {
      return obj[prop];
    });
    hb.registerHelper("toJson", function (recs) {
      return JSON.stringify(recs, null, 2);
    });
  }

  private getDefValue(p) {
    if (p.type === 'ParamList') {
      return [];
    } else {
      return "";
    }
  }

  private renderParsedView(result) {
    console.log(result);
    let ps = {};
    result.params.forEach(p => {
      ps[p.name] = (result.userParams && result.userParams[p.name]) || this.getDefValue(p)
    });

    const evt = { 
      query: result.query, 
      params: JSON.stringify(result.params, null, 2), 
      userParams: JSON.stringify(ps, null, 2),
      file: result.file
    }

    if (this.parsedHtml) {
      return this.parsedHtml(evt);
    } else {
      const tmp = hb.compile(this.loadHtml(this.extPath, "parsed.html"));
      return tmp(evt);
    }
  }

  private renderError(err) {
    return this.errorParseHtml({ err: err.message });
  }

  updateError(err): NyQLParsedView {
    this.initPanel();
    this.panel.webview.html = this.renderError(err);
    return this;
  }
  
  updateReplaced(replacedQuery: string) {
    this.initPanel();
    this.panel.webview.postMessage({
      command: 'replaced',
      query: replacedQuery
    })
  }

  update(serverResult, title?: string): NyQLParsedView {
    this.initPanel();
    if (title) {
      this.panel.title = title;
    }
    this.panel.webview.html = this.renderParsedView(serverResult);
    return this;
  }

  activate() {
    if (this.panel) {
      this.panel.reveal();
    }
  }

  dispose() {
    if (this.panel) {
      this.panel.dispose();
    }
  }

}