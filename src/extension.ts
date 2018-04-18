/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

"use strict";

import * as vscode from "vscode";

import { NyQLCompletionItemProvider } from "./nySuggest";

import { NyConnection } from "./nyModel";
import nySettings from "./nySettings";

const nyConnectionInfo: NyConnection  = {
  dialect: 'mysql',
  host: 'cmddtennakoon',
  username: 'root',
  password: '',
  databaseName: 'insight6'
} as NyConnection;

let connection;

export async function activate(context: vscode.ExtensionContext) {
  const nyDb = nySettings.getDb();
  
  const _ = await nyDb.reloadConnection(nyConnectionInfo);
  await nyDb.loadSchema();
  //console.log(tblNames);
  
  context.subscriptions.push(vscode.languages.registerCompletionItemProvider("nyql", new NyQLCompletionItemProvider(), 
    '.', '(', '$', '/', "'", '\"'));
}
