import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as hb from "handlebars";

export class NyQLParsedView implements vscode.Disposable {

  private panel: vscode.WebviewPanel;
  private parsedHtml;
  private errorParseHtml;

  constructor(extPath: string) {
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

  private renderParsedView(query: string) {
    return this.parsedHtml({ query: query });
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
    this.panel.webview.html = this.renderParsedView(serverResult.query);
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