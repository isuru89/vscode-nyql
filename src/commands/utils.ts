import * as vscode from "vscode";
import { existsSync } from "fs";

export function validUri(uri: vscode.Uri) {
  return uri && uri.fsPath && existsSync(uri.fsPath);
}