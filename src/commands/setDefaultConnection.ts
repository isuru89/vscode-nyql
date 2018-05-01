import { window as Win } from "vscode";
import nySettings from "../nySettings";

export async function setDefaultConnection() {
  const names = nySettings.getAllNyConnections(true).map(nc => nc.name);
  const pickedName = await Win.showQuickPick(names);
  if (pickedName) {
    await nySettings.setDefaultConnection(pickedName);
    Win.showInformationMessage(`Default connection set to ${pickedName}.`);
  }
}