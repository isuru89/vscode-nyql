import * as vscode from "vscode";

export async function openHtml(htmlUri: vscode.Uri, outputName: string, viewColumn: vscode.ViewColumn = vscode.ViewColumn.Two) {
  //let viewColumn: vscode.ViewColumn = vscode.ViewColumn.Two;
  //if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.viewColumn) {
    //viewColumn = vscode.window.activeTextEditor.viewColumn;
    //console.log(vscode.window.activeTextEditor.document.fileName);
  //}
  await vscode.commands.executeCommand('vscode.previewHtml', htmlUri, viewColumn, outputName)
}