import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as hb from "handlebars";

import { replaceQuery } from "../commands/replaceNyQL";

export class NyQLParsedView implements vscode.Disposable {

  private panel: vscode.WebviewPanel;
  private parsedHtml;
  private errorParseHtml;

  constructor(context: vscode.ExtensionContext) {
    const extPath = context.extensionPath;
    this.initPanel();
    this.parsedHtml = hb.compile(this.loadHtml(extPath, "parsed.html"));
    this.errorParseHtml = hb.compile(this.loadHtml(extPath, "error.html"));

    this.initHb();
  }

  private initPanel() {
    if (this.panel) {
      return;
    }

    this.panel = vscode.window.createWebviewPanel('nyqlParseView', 
      'Parsed Query', 
      vscode.ViewColumn.Two, 
      { enableScripts: true });
    this.panel.onDidDispose(e => this.panel = null);
    this.panel.webview.onDidReceiveMessage(msg => {
      replaceQuery(msg).then(result => {
        console.log(result);
        this.update({
          query: result.query,
          params: JSON.parse(msg.order),
          userParams: JSON.parse(msg.params)
        })
      })
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

  private renderParsedView(result) {
    console.log(result);
    let ps = {};
    result.params.forEach(p => {
      ps[p.name] = (result.userParams && result.userParams[p.name]) || ""
    });
    return this.parsedHtml({ query: result.query, params: JSON.stringify(result.params, null, 2), 
      userParams: JSON.stringify(ps, null, 2) });
  }

  private renderError(err) {
    return this.errorParseHtml({ err: err.message });
  }

  updateError(err): NyQLParsedView {
    this.initPanel();
    this.panel.webview.html = this.renderError(err);
    return this;
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