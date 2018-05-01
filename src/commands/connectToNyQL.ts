import { window as Win } from "vscode";

import nySettings from "../nySettings";

export async function connectForNyQL() {
  const names = nySettings.getAllNyConnections(true).map(nc => nc.name);
  const pickedName = await Win.showQuickPick(names);
  if (pickedName) {
    const picked = nySettings.getAllNyConnections().filter(nc => nc.name === pickedName);
    if (picked.length > 0) {
      await nySettings.refreshDb(picked[0]);
      Win.showInformationMessage(`Successfully connected to ${picked[0].name}.`);
    }
  }
}