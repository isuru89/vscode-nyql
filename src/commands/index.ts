import { window as Win, workspace as Ws, InputBoxOptions } from "vscode";
import { existsSync } from "fs";
import { isAbsolute, join } from "path";

import { parseScript as ps } from "./parseScript";
import { executeScript as es } from "./executeScript";
import nySettings from "../nySettings";



export const convertSqlToNyQL =  require('./convertSqlToNyQL');
export const parseScript = ps;
export const executeScript = es;

export const createNyQLConnection = require('./createNyQLConnection');
export const removeNyQLConnection = require('./removeNyQLConnection');
export const connectToNyQL = require('./connectToNyQL');

export const reloadSchema = require('./reloadSchema');
export const setDefaultConnection = require('./setDefaultConnection');
export const setRootScriptDir = require('./setScriptRootDir');
