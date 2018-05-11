/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

"use strict";

import * as vscode from "vscode";

import { NyQLCompletionItemProvider } from "./nySuggest";

import nySettings from "./nySettings";

import * as commands from "./commands";
import nyClient from "./client/nyClient";
import { NyReferenceProvider } from "./providers/nyReferences";
import { NyDefinitionProvider } from "./providers/nyDefinitionProvider";

export async function activate(context: vscode.ExtensionContext) {
  const NY_MODE = { language: 'nyql' };
  nySettings.extensionRoot = context.extensionPath;
  nySettings.init(context);

  registerCommands(context);

  context.subscriptions.push(nySettings);
  
  try {
    console.log(context.extensionPath);
    nyClient.start(context.extensionPath);
  } catch (err) {
    await nyClient.close();
  }

  
  const statusBar = nySettings.getNyStatusBar();
  statusBar.show();
  context.subscriptions.push(statusBar);

  // const nycon = nySettings.getDefaultConnection();
  // if (nycon) {
  //   await nySettings.refreshDb(nycon);
  // }

  context.subscriptions.push(vscode.languages.registerDefinitionProvider(NY_MODE, new NyDefinitionProvider()));
  context.subscriptions.push(vscode.languages.registerReferenceProvider(NY_MODE, new NyReferenceProvider()));
  context.subscriptions.push(vscode.languages.registerCompletionItemProvider("nyql", new NyQLCompletionItemProvider(), 
    '.', '(', '/', "'", '\"', '$'));
  
}

export async function deactivate() {
  console.log('Deactivating...');
  await nyClient.close();
  nySettings.dispose();
  return Promise.resolve();
}


function registerCommands(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.setRootScriptDir', commands.setRootScriptDir));
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.createNewNyQLConnection', commands.createNyQLConnection));
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.removeNyQLConnection', commands.removeNyQLConnection));
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.connectForNyQL', commands.connectToNyQL));
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.reloadSchema', commands.reloadSchema));
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.setDefaultConnection', commands.setDefaultConnection));
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.parseScript', commands.parseScript));
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.executeScript', commands.executeScript));
  ctx.subscriptions.push(vscode.commands.registerCommand('nyql.convertFromSql', commands.convertSqlToNyQL));
}
