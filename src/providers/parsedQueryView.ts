import * as vscode from "vscode";
import { getParsedResult, parseScript, getExecutedResult } from "../nyCommands";

export class NyQLViewHtml implements vscode.TextDocumentContentProvider {
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

  get onDidChange(): vscode.Event<vscode.Uri> {
    return this._onDidChange.event;
  }

  async update(uri: vscode.Uri) {
      this._onDidChange.fire(uri);
  }

  async provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken) {
    if (vscode.window.activeTextEditor) {
      if (uri.fragment === '/execute') {
        return this.renderExecuteResult();
      }

      try {
          const qr = await getParsedResult();
          return this.renderParsedView(qr.query);
      } catch (err) {
        return this.renderError(err);
      }
    }
  }

  private async renderExecuteResult() {
    try {
    const result = await getExecutedResult();
    const cols = result.columns as string[];
    const recs = result.result as any[];
    return `<!DOCTYPE html>
      <html>
      <head></head>
      <body>
        <div>
          <div>#${recs.length} record(s) returned.</div>
          <table border=1>
            <tr>
            ${cols.map(c => "<td><b>"+ c +"</b></td>")}
            </tr>
            ${recs.map(r => {
              return '<tr>'
                + cols.map(c => '<td>' + r[c] + '</td>')
                + '</tr>'
            })}
          </table>
        </div>
      </body>
      </html>
      `;
    } catch (err) {
      return this.renderError(err);
    }
  }

  private renderError(err) {
    return `<!DOCTYPE html>
    <html>
    <head></head>
    <body>
      <div>Cannot parse this query! May be this is a script!</div>
      <div>${err}</div>
    </body>
    </html>
    `
  }

  private renderParsedView(query: string) {
    return `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        html, body {
          height: 100%;
        }
        body {
          margin: 0;
          overflow: scroll;
        }
        pre {
          white-space: pre-wrap;       /* Since CSS 2.1 */
          white-space: -moz-pre-wrap;  /* Mozilla, since 1999 */
          line-height: 1.6;
          font-family: Menlo, Monaco, "Courier New", monospace;
      }
      </style>
    </head>
    <body>
        <div>
      <pre>${query}</pre>
      </div>
    </body>
    </html>
    `;
  }
}