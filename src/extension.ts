/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

"use strict";

import * as vscode from "vscode";

import { NyQLCompletionItemProvider } from "./nySuggest";

import * as fs from "fs";
import * as cmds from "./nyCommands";
import { NyConnection } from "./nyModel";
import nySettings from "./nySettings";
import { constants } from "fs";

import nyClient from "./client/nyClient";

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

  context.subscriptions.push(vscode.languages.registerCompletionItemProvider("nyql", new NyQLCompletionItemProvider(), 
    '.', '(', '/', "'", '\"', '$'));

  const preview = nySettings.previewHtml;
  let registration = vscode.workspace.registerTextDocumentContentProvider('nyql', preview);

  vscode.workspace.onDidSaveTextDocument((e: vscode.TextDocument) => {
    if (e) {
      console.log('on save triggered ', e.fileName)
      preview.update(nySettings.previewUri);
    }
  })
  vscode.window.onDidChangeActiveTextEditor((e: vscode.TextEditor) => {
    if (e && e.document && e.document.languageId == 'nyql') {
      console.log('nyql activated!')
      preview.update(nySettings.previewUri);
    }
  })

  context.subscriptions.push(registration);

  nyClient.start();
}

export async function deactivate() {
  console.log('Deactivating...');
  await nyClient.close();
  nySettings.dispose();
  return Promise.resolve();
}


function registerCommands(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.setRootScriptDir', cmds.setRootScriptDir));
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.createNewNyQLConnection', cmds.createNewNyQLConnection));
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.removeNyQLConnection', cmds.removeNyQLConnection));
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.connectForNyQL', cmds.connectForNyQL));
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.reloadSchema', cmds.reloadSchema));
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.setDefaultConnection', cmds.setDefaultConnection));
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.parseScript', cmds.parseScript));
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.executeScript', cmds.executeScript));
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.convertFromSql', cmds.convertSqlToNyQL));
}
