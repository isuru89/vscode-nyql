import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as hb from "handlebars";

const DEV = process.env['NYQL_VSCODE_DEV'] || false;

export class NyQLExecutionView implements vscode.Disposable {

  private panel: vscode.WebviewPanel;
  private execHtml;
  private errorExecHtml;
  private extPath;

  constructor(context: vscode.ExtensionContext) {
    const extPath = context.extensionPath;
    this.extPath = extPath;
    //this.initPanel();
    if (!DEV) {
      this.execHtml = hb.compile(this.loadHtml(extPath, "result.html"));
      this.errorExecHtml = hb.compile(this.loadHtml(extPath, "error-exec.html"));
    }
    this.initHb();
  }

  private initPanel() {
    if (this.panel) {
      return;
    }

    this.panel = vscode.window.createWebviewPanel('nyqlExecuteView', 
      'Executed Result', 
      vscode.ViewColumn.Two, 
      { enableScripts: true, retainContextWhenHidden: true });
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
      const dObj = { cols: cols, recs: recs };
      if (this.execHtml) {
        return this.execHtml(dObj);
      } else {
        const tmp = hb.compile(this.loadHtml(this.extPath, "result.html"));
        return tmp(dObj);
      }
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