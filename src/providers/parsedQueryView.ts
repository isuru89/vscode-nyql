import * as vscode from "vscode";
import { getParsedResult, parseScript } from "../commands/parseScript";
import { getExecutedResult } from "../commands/executeScript";
import * as fs from "fs";
import * as path from "path";
import * as hb from "handlebars";

export class NyQLViewHtml implements vscode.TextDocumentContentProvider {
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

  private parsedHtml;
  private executedHtml;
  private errorParseHtml;
  private errorExecHtml;

  constructor(extPath: string) {
    this.parsedHtml = hb.compile(this.loadHtml(extPath, "parsed.html"));
    this.executedHtml = hb.compile(this.loadHtml(extPath, "result.html"));
    this.errorParseHtml = hb.compile(this.loadHtml(extPath, "error.html"));
    this.errorExecHtml = hb.compile(this.loadHtml(extPath, "error-exec.html"));

    this.initHb();
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

  get onDidChange(): vscode.Event<vscode.Uri> {
    return this._onDidChange.event;
  }

  async update(uri: vscode.Uri) {
    this._onDidChange.fire(uri);
  }

  async provideTextDocumentContent(
    uri: vscode.Uri,
    token: vscode.CancellationToken
  ) {
    if (vscode.window.activeTextEditor) {
      if (uri.path === "/execute") {
        return this.renderExecuteResult();
      }

      try {
        const qr = await getParsedResult();
        return this.renderParsedView(qr.query);
      } catch (err) {
        console.log(err.message);
        return this.renderError(err);
      }
    }
  }

  private async renderExecuteResult() {
    try {
      const result = await getExecutedResult();
      const cols = result.columns as string[];
      const recs = result.result as any[];
      return this.executedHtml({ cols: cols, recs: recs });
    } catch (err) {
      return this.errorExecHtml({ err: err });
    }
  }

  private renderError(err) {
    return this.errorParseHtml({ err: err.message });
  }

  private renderParsedView(query: string) {
    return this.parsedHtml({ query: query });
  }
}
