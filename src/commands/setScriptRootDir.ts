import { window as Win, workspace as Ws, InputBoxOptions } from "vscode";
import { existsSync } from "fs";

import nySettings from "../nySettings";
import { toAbsDir } from "../utils";

export async function setRootScriptDir() {
  const rootDir = await Win.showInputBox({
    ignoreFocusOut: true,
    placeHolder: "Relative path to the workspace directory.",
    prompt: `Specify root scripts folder. [Current: ${nySettings.scriptsDir}]`,
    validateInput: v => {
      let dir = toAbsDir(v, Ws.rootPath);
      existsSync(dir)
        ? "Given directory does not exist! [" + dir + "]"
        : null;
    }
  } as InputBoxOptions);

  if (rootDir) {
    let wsroot = Ws.rootPath;
    let dir = toAbsDir(rootDir, wsroot);
    nySettings.setScriptsDir(dir);
    Win.showInformationMessage("NyQL script directory set to: \n" + dir);
  }
}