import * as vscode from "vscode";

import nySettings from "./nySettings";
import { isPositionInString } from "./utils";

import * as fs from 'fs';
import * as path from 'path';

const nyDb = nySettings.getDb();

const DSL_COMPLETION_ITEMS = [
    new vscode.CompletionItem('select', vscode.CompletionItemKind.Function),
    new vscode.CompletionItem('insert', vscode.CompletionItemKind.Function),
    new vscode.CompletionItem('delete', vscode.CompletionItemKind.Function),
    new vscode.CompletionItem('update', vscode.CompletionItemKind.Function),
    new vscode.CompletionItem('insertOrLoad', vscode.CompletionItemKind.Function),
    new vscode.CompletionItem('upsert', vscode.CompletionItemKind.Function),
    new vscode.CompletionItem('truncate', vscode.CompletionItemKind.Function),
    new vscode.CompletionItem('dbFunction', vscode.CompletionItemKind.Function),
    new vscode.CompletionItem('cte', vscode.CompletionItemKind.Function),
    new vscode.CompletionItem('bulkInsert', vscode.CompletionItemKind.Function),
    new vscode.CompletionItem('bulkDelete', vscode.CompletionItemKind.Function),
    new vscode.CompletionItem('bulkUpdate', vscode.CompletionItemKind.Function),
    new vscode.CompletionItem('script', vscode.CompletionItemKind.Function),
    new vscode.CompletionItem('union', vscode.CompletionItemKind.Function),
    new vscode.CompletionItem('unionDistinct', vscode.CompletionItemKind.Function),
];

const NYQL_GLOB_VARIABLES_D = [
  new vscode.CompletionItem('$DSL', vscode.CompletionItemKind.Constant),
  new vscode.CompletionItem('$SESSION', vscode.CompletionItemKind.Constant),
  new vscode.CompletionItem('$DB', vscode.CompletionItemKind.Constant),
  new vscode.CompletionItem('$IMPORT', vscode.CompletionItemKind.Constant),
];

const _NYQL_ALIAS_SNIPPET = new vscode.CompletionItem('alias', vscode.CompletionItemKind.Method);
_NYQL_ALIAS_SNIPPET.detail = 'Alias the specified entity.';
_NYQL_ALIAS_SNIPPET.insertText = new vscode.SnippetString('alias(\'${1:als}\')');

const NYQL_COLUMN_HELPER_ITEMS = [
    _NYQL_ALIAS_SNIPPET
];

class NyQLTableCompletionItem extends vscode.CompletionItem {
    constructor(label: string) {
        super(label, vscode.CompletionItemKind.Struct);
        this.detail = 'Table';
    }
}

class NyQLColumnCompletionItem extends vscode.CompletionItem {
    constructor(label: string) {
        super(label, vscode.CompletionItemKind.EnumMember);
        this.detail = 'Column';
    }
}

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
      if (!inString && lineTillCurrentPosition.endsWith('"')) {
        return resolve([]);
      }

      let wordAtPosition = document.getWordRangeAtPosition(position);
      let currentWord = "";
      if (
        wordAtPosition &&
        wordAtPosition.start.character < position.character
      ) {
        let word = document.getText(wordAtPosition);
        currentWord = word.substr(
          0,
          position.character - wordAtPosition.start.character
        );
      }

      if (context.triggerCharacter === ".") {
        let match = /\$(DSL)\.$/g.exec(lineTillCurrentPosition);
        if (match) {
            return resolve(this.withDSLContents());
        }
         match = /\b(\w+)\.$/g.exec(lineTillCurrentPosition);
        if (match) {
          let currTableName = match[1];
          const colNames: string[] = nyDb.getColumns(currTableName);
          if (colNames) {
            return resolve(this.fromColumns(colNames));
          } else {
            // check for table.column. pattern
            match = /\b(\w+)\.(\w+)\.$/g.exec(lineTillCurrentPosition);
            if (match) {
                const wTable = match[1];
                const wColumn = match[2];
                if (nyDb.validTableColumn(wTable, wColumn)) {
                    return resolve(NYQL_COLUMN_HELPER_ITEMS);
                } else {
                    // try finding table alias
                    const refTbl = this._findTableNameWithAlias(wTable, document, position);
                    if (refTbl && nyDb.validTableColumn(refTbl, wColumn)) {
                        return resolve(NYQL_COLUMN_HELPER_ITEMS);
                    } else {
                        return resolve(NYQL_COLUMN_HELPER_ITEMS);
                    }
                }
            } else {
                // check for table aliases, before the current position
              const refTableName = this._findTableNameWithAlias(currTableName, document, position);
              if (refTableName) {
                  return resolve(this.fromTableColumns(refTableName));
              }
            }
          }
        }
      } else if (context.triggerCharacter === '(') {
          const alsItems = this._aliasCompletedItems(document, position);
          resolve(this.withTables().concat(alsItems));
      } else if (context.triggerCharacter === "'" || context.triggerCharacter === '\"' || context.triggerCharacter === '/') {
        return this.getScriptsDirItems(resolve, lineTillCurrentPosition);
      } else {
        // triggers when user explicitly pressed ctrl+space
        resolve(this._miscCompletionItems(document, position));
      }
      resolve([]);
    });
  }

  private _miscCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
    return this._aliasCompletedItems(document, position).concat(NYQL_COLUMN_HELPER_ITEMS)
          .concat(NYQL_GLOB_VARIABLES_D).concat(DSL_COMPLETION_ITEMS);
  }

  private _aliasCompletedItems(document: vscode.TextDocument, position: vscode.Position) {
    return this._collectAllAliases(document, position)
      .map(als => new vscode.CompletionItem(als, vscode.CompletionItemKind.Property));
  }

  private _collectAllAliases(document: vscode.TextDocument, position: vscode.Position) {
    let textTillPos = document.getText(new vscode.Range(document.positionAt(0), position));
    let re = /(\w+)?.alias\s*\(\s*['\"](\w+)['\"]\s*\)/g;
    let m;

    let alss: Set<string> = new Set<string>();
    do {
        m = re.exec(textTillPos);
        if (m) {
            alss.add(m[2]);
        }
    } while (m)
    return Array.from(alss);
  }

  private _findTableNameWithAlias(alias: string, document: vscode.TextDocument, position: vscode.Position) : string {
    let textTillPos = document.getText(
        new vscode.Range(document.positionAt(0), position)
      );
      let re = new RegExp("\\.alias\\s*\\(\\s*['\\\"](" + alias + ")['\\\"]\\s*\\)");
      const lastAlsPos = re.exec(textTillPos);
      if (lastAlsPos) {
        const ppos = textTillPos.lastIndexOf("(", lastAlsPos.index);
        const tbNameDirty = textTillPos
          .substring(ppos + 1, lastAlsPos.index)
          .trim();
        if (tbNameDirty.endsWith(")")) {        // matching TABLE('name') instances
          let match = /['\"]([^'\"]+)['\"]/g.exec(tbNameDirty);
          if (match) {
            return match[1];
          }
        } else {
          return tbNameDirty;
        }
      } 
      return null;
  }

  private withDSLContents() : vscode.CompletionItem[] {
    return DSL_COMPLETION_ITEMS;
  }

  private withTables() : vscode.CompletionItem[] {
      return nyDb.getTables().map(t => new NyQLTableCompletionItem(t));
  }

  private fromTableColumns(tableName: string) : vscode.CompletionItem[] {
      return this.fromColumns(nyDb.getColumns(tableName));
  }

  private fromColumns(columns: string[]) : vscode.CompletionItem[] {
      if (columns) {
        return columns.map(cn => new NyQLColumnCompletionItem(cn));
      } else {
          return [];
      }
  }

  private getScriptsDirItems(resolve: Function, lineTill: string) {
    const ppos = Math.max(lineTill.lastIndexOf('\"'), lineTill.lastIndexOf("'"), 0);
    const prfx = lineTill.substring(0, ppos).trim();
    const ppath = lineTill.substring(ppos+1);
    
    if (!/\b\$?(IMPORT|RUN|IMPORT_SAFE)\s*\(\s*/g.exec(prfx)) {
      return;
    }

    return this.getFolderItems(path.join(nySettings.getScriptsDir(), ppath)).then(results => {
      let items: Array<vscode.CompletionItem> = new Array<vscode.CompletionItem>();
      results.forEach(r => {
        let ci = new vscode.CompletionItem(r.i, r.d ? vscode.CompletionItemKind.Folder : vscode.CompletionItemKind.File);
        ci.sortText = r.d ? 'd' : 'f';
        items.push(ci);
      });

      return resolve(items);
    });
  }

  /**
     * Builds a list of the available files and folders from the provided path.
     */
    private getFolderItems(folderPath: string): Promise<any[]> {
      return new Promise(function(resolve, reject) {
          fs.readdir(folderPath, function(err, items) {
              if (err) {
                  return reject(err);
              }
              var results = [];

              items.forEach(item => {
                  try {
                      const pt = path.join(folderPath, item);
                      const isd = fs.statSync(pt).isDirectory();
                      if (isd) {
                        results.push({i: item, d: isd, p: pt});
                      } else if (item.toLowerCase().endsWith('.groovy') || item.toLowerCase().endsWith('.nyql')) {
                        results.push({i: item.substring(0, item.lastIndexOf('.')), d: isd, p: pt});
                      }
                  } catch (err) {
                      // silently ignore permissions errors
                  }
              });

              resolve(results);
          });
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
