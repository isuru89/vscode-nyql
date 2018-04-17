/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

"use strict";

import * as vscode from "vscode";

import { NyQLCompletionItemProvider } from "./nySuggest";

import nyDb from "./nyDb";

const mysqlConnectionInfo = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'accello'
}

let connection;



export async function activate(context: vscode.ExtensionContext) {
  const _ = await nyDb.reloadConnection(mysqlConnectionInfo);
  const tblNames = await nyDb.loadSchema();
  console.log(tblNames);
  
  context.subscriptions.push(vscode.languages.registerCompletionItemProvider("nyql", new NyQLCompletionItemProvider(), '.'));
}
