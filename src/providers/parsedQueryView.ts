import * as vscode from "vscode";
import { getParsedResult, parseScript } from "../nyCommands";

export class NyQLViewHtml implements vscode.TextDocumentContentProvider {
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

  get onDidChange(): vscode.Event<vscode.Uri> {
    return this._onDidChange.event;
  }

  async update(uri: vscode.Uri) {
      console.log('updating...');
      this._onDidChange.fire(uri);
  }

  async provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken) {
    try {
      if (vscode.window.activeTextEditor) {
        // console.log('calling ', vscode.window.activeTextEditor.document.languageId)
        const qr = await getParsedResult();
        return this.renderParsedView(qr.query);
        //this.html.set(uri.fragment, this.renderParsedView(qr.query));
      }
    } catch (err) {
      //this.html.set(uri.fragment, this.renderError(err));
      return this.renderError(err);
    }
    //return this.html.get(uri.fragment);
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