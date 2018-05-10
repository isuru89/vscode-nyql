import { window as Win } from "vscode";
import nySettings from "../nySettings";

export async function setDefaultConnection() {
  const currCon = nySettings.getActiveNyConnection().name;
  const names = nySettings.getAllNyConnections(true).map(nc => nc.name);
  const pickedName = await Win.showQuickPick(names);
  if (pickedName) {
    await nySettings.setDefaultConnection(pickedName);
    if (pickedName !== currCon) {
      const response = await Win.showInformationMessage(`Default connection set to ${pickedName}. Do you want to connect it to now?`, "Yes", "No");
      if (response === "Yes") {
        nySettings.reloadSchema();
      }
    } else {
      Win.showInformationMessage(`Default connection set to ${pickedName}.`);
    }
  }
}