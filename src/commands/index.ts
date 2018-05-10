import { parseScript as ps } from "./parseScript";
import { executeScript as es } from "./executeScript";

import { connectForNyQL as refConnectToNyQL } from "./connectToNyQL";
import { convertSqlToNyQL as refConvertToNyQL } from "./convertSqlToNyQL";
import { createNewNyQLConnection as refCreate } from "./createNyQLConnection";
import { removeNyQLConnection as refRemove } from "./removeNyQLConnection";
import { reloadSchema as refReload } from "./reloadSchema";
import { setDefaultConnection as refDefaultCon } from "./setDefaultConnection";
import { setRootScriptDir as refRootScript } from "./setScriptRootDir";

export const convertSqlToNyQL =  refConvertToNyQL;
export const parseScript = ps;
export const executeScript = es;

export const createNyQLConnection = refCreate;
export const removeNyQLConnection = refRemove;
export const connectToNyQL = refConnectToNyQL;

export const reloadSchema = refReload;
export const setDefaultConnection = refDefaultCon;
export const setRootScriptDir = refRootScript;
