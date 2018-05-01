import { window as Win } from "vscode";
import nySettings from "../nySettings";

export async function removeNyQLConnection() {
  const names = nySettings.getAllNyConnections(true).map(nc => nc.name);
  const picked = await Win.showQuickPick(names);
  if (picked) {
    if (nySettings.removeNyConnection(picked)) {
      Win.showInformationMessage(`Successfully removed connection ${picked}!`);
    }
  }
}