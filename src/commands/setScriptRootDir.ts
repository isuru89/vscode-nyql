import { window as Win, workspace as Ws, InputBoxOptions, Uri } from "vscode";
import { existsSync, lstatSync } from "fs";

import nySettings from "../nySettings";
import { toAbsDir } from "../utils";
import { validUri } from "./utils";

export async function setRootScriptDir(uri: Uri = null) {
  let dir = null;
  if (validUri(uri) && lstatSync(uri.fsPath).isDirectory()) {
    dir = uri.fsPath;
  } else {
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
      dir = toAbsDir(rootDir, wsroot);
    }
  }

  if (dir) {
    nySettings.setScriptsDir(dir);
    Win.showInformationMessage("NyQL script directory set to: \n" + dir);
  }
}