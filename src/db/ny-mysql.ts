import * as mysql from "mysql2/promise";

import { NyDatabaseImpl, NyConnection, NySchemaInfo, NyDatabase, NyColumn, NyTable } from "../nyModel";

export class NyMySqlImpl implements NyDatabaseImpl {

    private conOptions: mysql.ConnectionOptions;
    private connection: mysql.Connection;

    reloadConnection(connectionInfo: NyConnection): Promise<NyDatabaseImpl> {
        this.conOptions = {
            host: connectionInfo.host,
            port: connectionInfo.port || 3306,
            user: connectionInfo.username,
            password: connectionInfo.password,
            database: connectionInfo.databaseName
        } as mysql.ConnectionOptions;

        return new Promise((resolve, reject) => {
            mysql.createConnection(this.conOptions).then(conn => {
                this.connection = conn;
                resolve(this);
            }).catch(err => reject(err));
        });
    }

    async loadSchema(): Promise<NySchemaInfo> {
        const db = new NyDatabase(this.conOptions.database);
        const [rows, fields] = await this.connection.query('SHOW TABLES;');
        const colName = fields[0].name;
        let columns = new Map<string, Array<NyColumn>>();
        let tables = new Set<NyTable>();

        let schemaInfo: NySchemaInfo = new NySchemaInfo();
        schemaInfo.database = db;

        if (rows instanceof Array) {
            const rs = rows as mysql.RowDataPacket[];
            const tblNames = rs.map(r => r[colName]);

            for (let i = 0; i < tblNames.length; i++) {
                // @TODO load this from configurations
                const tbl = this.toTitleCase(tblNames[i]);
                tables.add(new NyTable(tbl, db));

                const [colDefs, colFields] = await this.connection.query('DESCRIBE ' + tbl + ';');
                const cols = colDefs as mysql.RowDataPacket[];
                columns.set(tbl, this._mapToCols(cols));
            }

            schemaInfo.tables = Array.from(tables);
            schemaInfo.columns = columns;
            return Promise.resolve(schemaInfo);
        } else {
            return Promise.resolve(new NySchemaInfo());
        }
    }

    private toTitleCase(str: string): string {
        return str.split('_').map(w => w.charAt(0).toUpperCase() + w.substring(1)).join('_');
    }

    private _mapToCols(colDefs: mysql.RowDataPacket[]): Array<NyColumn> {
        return colDefs.map(cn => {
            let nyc: NyColumn = new NyColumn();
            nyc.name = cn['Field'];
            nyc.type = cn['Type'];
            return nyc;
        })
    }
}