import * as vscode from "vscode";
import * as p from "path";
import * as fs from "fs";

export function toAbsDir(path: string, wsRoot: string) {
  let dir = path || wsRoot;
  if (!p.isAbsolute(dir)) {
    dir = p.join(wsRoot, path);
  }
  return dir;
}

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

export function createDataFile(file) {
	if (!fs.existsSync(file)) {
		fs.openSync(file, 'w');
	}
	return file;
}

export function replaceText(editor: vscode.TextEditor, text, range?: vscode.Range) {
	let rng = range;
	const doc = editor.document;
	if (!rng) {
		rng = new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length));
	}
	if (text instanceof vscode.SnippetString) {
		editor.insertSnippet(text, rng);
	} else {
		editor.insertSnippet(new vscode.SnippetString(text), rng);
	}
}

export function fetchAllReqParams(parsedQuery): any[] {
	if (!parsedQuery) {
		return null;
	} 
	
	if (parsedQuery.parsable === false) {
		const a1 = parsedQuery.info.params as any[];
		const a2 = (parsedQuery.info.usedSessionVars as string[]).map(s => {
			return { name: s, type: 'AParam' }
		});
		return a1.concat(a2);
	}

	if (parsedQuery.params && parsedQuery.params.length > 0) {
		return parsedQuery.params as any[];
	} else {
		return [];
	}
}

export function createSnippetParams(json, missedParams: string[] = []): vscode.SnippetString {
		if (missedParams && missedParams.length > 0) {
			for (let index = 0; index < missedParams.length; index++) {
				const element = missedParams[index];
				json[element] = '${' + (index+1) + ':value}';	// @TODO append values as its type
			}
		}
		return new vscode.SnippetString(JSON.stringify(json, null, 2));
}

export function readFileAsJson(file, def={}, whenEmpty={}) {
	try {
		if (fs.existsSync(file)) {
			const jsonstr = fs.readFileSync(file).toString();
			if (jsonstr && jsonstr.trim().length > 0) {
				const obj = JSON.parse(jsonstr);
				if (Object.keys(obj).length === 0 && obj.constructor === Object) {
					return whenEmpty;
				} else {
					return obj;
				}
			}
		}
	} catch (err) {
	}
	return def;
}

export function getMissingParameters(json, params: any[]): string[] {
	let missedParams = [];
	for (let index = 0; index < params.length; index++) {
		const pName = params[index].name;
		if (!json[pName]) {
			missedParams.push(pName);
		}
	}
	return missedParams;
}