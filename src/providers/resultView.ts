import * as vscode from "vscode";

export class NyQLResultView implements vscode.TextDocumentContentProvider {
  public uri: vscode.Uri = vscode.Uri.parse('nyql://isuru/result');
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

  get onDidChange(): vscode.Event<vscode.Uri> {
      return this._onDidChange.event;
  }

  update(uri: vscode.Uri) {
    this._onDidChange.fire(uri);
  }

  provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
    throw new Error("Method not implemented.");
  }
}