import { window as Win, QuickPickItem } from "vscode";

import nySettings from "../nySettings";
import { NyConnection } from "../nyModel";
import { createNewNyQLConnection } from "./createNyQLConnection";

const ADD_NEW_CONNECTION = {
  label: '[ Create New Connection... ]'
} as QuickPickItem;

export async function connectForNyQL() {
  // @TODO ask if no nyql root dir has set
  const names = createPicksFromConnections(nySettings.getAllNyConnections(true));
  const pickedName = await Win.showQuickPick(names);
  if (pickedName) {
    if (pickedName === ADD_NEW_CONNECTION) {
      await createNewNyQLConnection();
    } else {
      const picked = nySettings.getAllNyConnections().filter(nc => nc.name === pickedName.label);
      if (picked.length > 0) {
        await nySettings.refreshDb(picked[0]);
        Win.showInformationMessage(`Successfully connected to ${picked[0].name}.`);
      }
    }
  }
}

function createPicksFromConnections(connections: Array<NyConnection>): Array<QuickPickItem> {
  let result = [];
  if (connections) {
    result = connections.map(c => ({
      label: c.name,
      description: `${c.host}:${c.port}/${c.databaseName}`
    } as QuickPickItem))
  } 
  return result.concat(ADD_NEW_CONNECTION);
}