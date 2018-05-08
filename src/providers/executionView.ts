import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as hb from "handlebars";

export class NyQLExecutionView implements vscode.Disposable {

  private panel: vscode.WebviewPanel;
  private execHtml;
  private errorExecHtml;

  constructor(extPath: string) {
    this.initPanel();
    this.execHtml = hb.compile(this.loadHtml(extPath, "result.html"));
    this.errorExecHtml = hb.compile(this.loadHtml(extPath, "error-exec.html"));

    this.initHb();
  }

  private initPanel() {
    if (this.panel) {
      return;
    }

    this.panel = vscode.window.createWebviewPanel('nyqlExecuteView', 
      'Executed Result', 
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

  private renderExecuteResult(result) {
    try {
      const cols = result.columns as string[];
      const recs = result.result as any[];
      return this.execHtml({ cols: cols, recs: recs });
    } catch (err) {
      return this.errorExecHtml({ err: err });
    }
  }

  private renderError(err) {
    return this.errorExecHtml({ err: err.message });
  }

  updateError(err): NyQLExecutionView {
    this.initPanel();
    this.panel.webview.html = this.renderError(err);
    return this;
  }
  
  update(serverResult, title?: string): NyQLExecutionView {
    this.initPanel();
    if (title) {
      this.panel.title = title;
    }
    this.panel.webview.html = this.renderExecuteResult(serverResult);
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