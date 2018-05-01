import nySettings from "../nySettings";

export async function reloadSchema() {
  await nySettings.reloadSchema();
}