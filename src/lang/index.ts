import { CompletionItem, CompletionItemKind, SnippetString } from "vscode";

import { DSL_FUNCTIONS } from "./func.dsl";
import { DSL_CONSTANTS } from "./vars.dsl";
import { MATH_FUNCTIONS } from "./func.math";
import { STR_FUNCTIONS } from "./func.str";
import { TIME_FUNCTIONS } from "./func.time";
import { MISC_FUNCTIONS } from "./func.misc";

const tbl = [{
  name: 'COLUMN',
  description: 'Refer a column by provided string',
  insertText: new SnippetString("COLUMN('${1:columnName}')${0}")
}, {
  name: 'COLUMN_AS',
  description: 'Refer a column with different alias than it is being currently used.',
  insertText: new SnippetString("COLUMN_AS('${1:column}', '${2:newAlias}')${0}")
}, {
  name: 'alias',
  description: 'Assign an alias for this table',
  insertText: new SnippetString("alias('${1:als}')${0}")
}, {
  name: 'ALL',
  description: 'Fetch all columns of this table',
  insertText: 'ALL()'
}];

export const FUNCTIONS = MATH_FUNCTIONS.concat(STR_FUNCTIONS).concat(TIME_FUNCTIONS).concat(MISC_FUNCTIONS).map(it => {
  let ci = new CompletionItem(it.name, CompletionItemKind.Function);
  ci.detail = it.description;
  if (it.snippet) {
    ci.insertText = new SnippetString(it.snippet);
  }
  return ci;
});

export const DSL_COMPLETION_ITEMS = DSL_FUNCTIONS.map(it => {
  let ci = new CompletionItem(it.name, CompletionItemKind.Function);
  ci.detail = it.description;
  return ci;
});

export const CONSTANT_COMPLETION_ITEMS = DSL_CONSTANTS.map(it => {
  let ci = new CompletionItem(it.name, CompletionItemKind.Variable);
  ci.detail = it.description;
  ci.filterText = it.filterText;
  ci.insertText = it.insertText;
  return ci;
});

export const TABLE_COMPLETION_ITEMS = tbl.map(t => {
  let ci = new CompletionItem(t.name, CompletionItemKind.Method);
  ci.detail = t.description;
  if (t.insertText) {
    ci.insertText = t.insertText;
  }
  return ci;
});
