/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

"use strict";

import * as vscode from "vscode";

import { NyQLCompletionItemProvider } from "./nySuggest";

import * as cmds from "./nyCommands";
import { NyConnection } from "./nyModel";
import nySettings from "./nySettings";
import { constants } from "fs";

const nyConnectionInfo: NyConnection  = {
  dialect: 'mysql',
  host: 'cmddtennakoon',
  username: 'root',
  password: '',
  databaseName: 'insight6'
} as NyConnection;

let connection;

export async function activate(context: vscode.ExtensionContext) {
  registerCommands(context);

  context.subscriptions.push(nySettings);
  
  const statusBar = nySettings.getNyStatusBar();
  statusBar.show();
  context.subscriptions.push(statusBar);

  const nycon = nySettings.getDefaultConnection();
  if (nycon) {
    await nySettings.refreshDb(nycon);
  }
  // const _ = await nyDb.reloadConnection(nyConnectionInfo);
  // await nyDb.loadSchema();
  // statusBar.text = '$(database) NyQL: ' + nyConnectionInfo.databaseName;
  //console.log(tblNames);
  
  context.subscriptions.push(vscode.languages.registerCompletionItemProvider("nyql", new NyQLCompletionItemProvider(), 
    '.', '(', '/', "'", '\"'));
}


function registerCommands(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.setRootScriptDir', cmds.setRootScriptDir));
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.createNewNyQLConnection', cmds.createNewNyQLConnection));
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.removeNyQLConnection', cmds.removeNyQLConnection));
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.connectForNyQL', cmds.connectForNyQL));
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.reloadSchema', cmds.reloadSchema));
}
