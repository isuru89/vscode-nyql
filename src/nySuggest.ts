import * as vscode from "vscode";

import nyDb from "./nyDb";
import { isPositionInString } from "./utils";

export class NyQLCompletionItemProvider
  implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    return this.provideItemsInternal(document, position, token, context);
  }

  //   resolveCompletionItem?(
  //     item: vscode.CompletionItem,
  //     token: vscode.CancellationToken
  //   ): vscode.ProviderResult<vscode.CompletionItem> {
  //     throw new Error("Method not implemented.");
  //   }

  provideItemsInternal(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {

    return new Promise<vscode.CompletionItem[]>((resolve, reject) => {
      let filename = document.fileName;
      let lineText = document.lineAt(position.line).text;
      let lineTillCurrentPosition = lineText.substr(0, position.character);

      let inString = isPositionInString(document, position);
        if (!inString && lineTillCurrentPosition.endsWith('\"')) {
            return resolve([]);
        }

        let wordAtPosition = document.getWordRangeAtPosition(position);
        let currentWord = '';
        if (wordAtPosition && wordAtPosition.start.character < position.character) {
            let word = document.getText(wordAtPosition);
            currentWord = word.substr(0, position.character - wordAtPosition.start.character);
        }

        if (context.triggerCharacter === '.') {
            let match = /\b([a-zA-Z0-9_]+)\.$/g.exec(lineTillCurrentPosition);
            if (match) {
                let currTableName = match[1];
                const colNames: string[] = nyDb.getColumns(currTableName);
                if (colNames) {
                    return resolve(colNames.map(cn => new vscode.CompletionItem(cn)));
                } else {
                    // check for table.column pattern
                    match = /\b([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\.$/g.exec(lineTillCurrentPosition);
                    if (match && nyDb.validTableColumn(match[1], match[2])) {
                        return resolve([new vscode.CompletionItem('ABC')]);
                    } else {
                        // check for table aliases, before the current position
                        let textTillPos = document.getText(new vscode.Range(document.positionAt(0), position));
                        let re = new RegExp("\\.alias\\s*\\(\\s*['\\\"](" + currTableName + ")['\\\"]\\s*\\)");
                        const lastAlsPos = re.exec(textTillPos);
                        if (lastAlsPos) {
                            const ppos = textTillPos.lastIndexOf('(', lastAlsPos.index);
                            const tbNameDirty = textTillPos.substring(ppos + 1, lastAlsPos.index).trim();
                            if (tbNameDirty.endsWith(')')) {
                                match = /['\"]([^'\"]+)['\"]/g.exec(tbNameDirty);
                                if (match) return resolve(nyDb.getColumns(match[1]).map(cn => new vscode.CompletionItem(cn)));
                            } else {
                                return resolve(nyDb.getColumns(tbNameDirty).map(cn => new vscode.CompletionItem(cn)));
                            }
                        }
                        return resolve([]);
                    }
                }
            }
        }
        resolve([]);
});
  }

  createSnippetItem(): vscode.CompletionItem {
    // Read more here:
    // https://code.visualstudio.com/docs/extensionAPI/vscode-api#CompletionItem
    // https://code.visualstudio.com/docs/extensionAPI/vscode-api#SnippetString

    // For SnippetString syntax look here:
    // https://code.visualstudio.com/docs/editor/userdefinedsnippets#_creating-your-own-snippets

    let item = new vscode.CompletionItem(
      "Good part of the day",
      vscode.CompletionItemKind.Snippet
    );
    item.insertText = new vscode.SnippetString(
      "Good ${1|morning,afternoon,evening|}. It is ${1}, right?"
    );
    item.documentation = new vscode.MarkdownString(
      "Inserts a snippet that lets you select the _appropriate_ part of the day for your greeting."
    );

    return item;
  }
}
