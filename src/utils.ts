import * as vscode from "vscode";
import * as p from "path";

export function isPositionInString(document: vscode.TextDocument, position: vscode.Position): boolean {
	let lineText = document.lineAt(position.line).text;
	let lineTillCurrentPosition = lineText.substr(0, position.character);

	// Count the number of double quotes in the line till current position. Ignore escaped double quotes
	let doubleQuotesCnt = (lineTillCurrentPosition.match(/\"/g) || []).length;
	let escapedDoubleQuotesCnt = (lineTillCurrentPosition.match(/\\\"/g) || []).length;

	doubleQuotesCnt -= escapedDoubleQuotesCnt;
	return doubleQuotesCnt % 2 === 1;
}

export function filenameWithouExt(path: string): string {
  const bsname = p.basename(path)
	const pos = bsname.lastIndexOf('.');
	if (pos > 0) {
		return bsname.substr(0, pos);
	} else {
		return bsname;
	}
}