import * as vscode from "vscode";
import { getParsedResult } from "../nyCommands";

export class NyQLViewHtml implements vscode.TextDocumentContentProvider {
  constructor(public uri: vscode.Uri = vscode.Uri.parse('nyql://engine')) {

  }
  onDidChange?: vscode.Event<vscode.Uri>;

  async update(doc?: vscode.TextDocument) {
    try {
     const result = await getParsedResult();
     return this.renderParsedView(result.query);
    } catch (err) {
      console.log(err);
      return this.renderError();
    }
  }

  async provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken) {
    return await this.update();
  }

  private renderError() {
    return `<!DOCTYPE html>
    <html>
    <head></head>
    <body><div>Cannot parse this query! May be this is a script!</div></body>
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
          width: 100%;
          height: 100%;
        }
        body {
          margin: 0;
          overflow: hidden;
        }
      </style>
    </head>
    <body>
      <pre>${query}</pre>
    </body>
    </html>
    `;
  }
}