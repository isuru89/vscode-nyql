import { window as Win, ProgressLocation } from "vscode";

import nySettings from "../nySettings";
import { NyConnection } from "../nyModel";
import { version } from "punycode";

export async function createNewNyQLConnection() {
  const dialect = await Win.showQuickPick(['MySQL']);
  if (!dialect) {
    Win.showInformationMessage('You cancelled the NyQL connection creation!');
    return;
  }
  const host = await Win.showInputBox({ prompt: 'Host machine name or ip address' });
  if (!host) {
    Win.showInformationMessage('You cancelled the NyQL connection creation!');
    return;
  }
  const port = await Win.showInputBox({ prompt: 'Port of the ' + dialect + ' service', value: "3306" });
  const user = await Win.showInputBox({ prompt: 'Username for the database' });
  const pw = await Win.showInputBox({ prompt: 'Password for the database. Keep empty if no password is needed.', password: true });
  
  let name = await Win.showInputBox({ prompt: 'Enter a name for new NyQL connection' });
  let nameFlag: boolean = false;
  if (!name) {
    name = host + "/";
    nameFlag = true;
  }
  const nycon: NyConnection = {
    name: name,
    host: host,
    port: parseInt(port),
    dialect: dialect,
    username: user,
    password: pw
  } as NyConnection;

  try {
     const dbNames = await Win.withProgress({
      location: ProgressLocation.Notification,
      title: 'Loading database names...',
    }, (progress, token) => {
      return nySettings.getDb().loadDatabaseNames(nycon);
    });
    // const dbNames = await nySettings.getDb().loadDatabaseNames(nycon);
    const dbName = await Win.showQuickPick(dbNames);
    nycon.databaseName = dbName;
    if (nameFlag) nycon.name = nycon.name + dbName;
    const addedCon = nySettings.addNyConnection(nycon);
    const reply = await Win.showInformationMessage(`Successfully added new NyQL connection ${addedCon.name}.`, 
      'Connect Now', 'Later');
    if (reply === 'Connect Now') {
      await nySettings.refreshDb(addedCon);
      Win.showInformationMessage(`Successfully connected to ${addedCon.name}.`);
    }

  } catch (err) {
    const e = err as Error;
    console.error(e);
    Win.showErrorMessage(`Server connection failed! [${nycon.host}] : ` + e.message);
  }
}
