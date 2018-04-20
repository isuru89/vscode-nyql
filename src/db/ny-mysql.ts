import * as mysql from "mysql2/promise";

import { NyDatabaseImpl, NyConnection, NySchemaInfo, NyDatabase, NyColumn, NyTable } from "../nyModel";

const _RESERVED_TABLES: Set<string> = new Set<string>();
_RESERVED_TABLES.add('sys');
_RESERVED_TABLES.add('mysql');
_RESERVED_TABLES.add('performance_schema');
_RESERVED_TABLES.add('information_schema');

export class NyMySqlImpl implements NyDatabaseImpl {

    private conOptions: mysql.ConnectionOptions;
    private connection: mysql.Connection;
    private originalCon: NyConnection;

    async close() {
        this.conOptions = null;
        await this.connection.end();
        this.connection = null;
    }

    validateConnection(connectionInfo: NyConnection): boolean {
        if (connectionInfo) {
            if (!connectionInfo.host) return false;
            if (!connectionInfo.username) return false;
            if (!connectionInfo.password) return false;
            if (!connectionInfo.databaseName) return false;
            return true;
        } else {
            return false;
        }
    }

    async fetchDatabases(con: NyConnection) : Promise<string[]> {
        let tmpCon: mysql.Connection;
        try {
            tmpCon = await mysql.createConnection(this._convertToMySqlCon(con));
            let [rows, fields] = await tmpCon.query('SHOW DATABASES;');
            if (rows instanceof Array) {
                const rs = rows as Array<mysql.RowDataPacket>;
                return rs.map(r => r['Database'])
                    .filter(r => !_RESERVED_TABLES.has(r));
            } 

        } finally {
            if (tmpCon) {
                tmpCon.end();
            }
        }
        return Promise.reject(new Error(`Cannot connect to the server ${con.host}!`));
    }

    async reloadConnection(connectionInfo: NyConnection) {
        this.originalCon = connectionInfo;
        this.conOptions = this._convertToMySqlCon(connectionInfo);

        this.connection = await mysql.createConnection(this.conOptions);
        return this;
    }

    private _convertToMySqlCon(connectionInfo: NyConnection) {
        return {
            host: connectionInfo.host,
            port: connectionInfo.port || 3306,
            user: connectionInfo.username,
            password: connectionInfo.password,
            database: connectionInfo.databaseName
        } as mysql.ConnectionOptions;
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
                const tbl = this.originalCon.autoCapitalizeTableNames ? this.toTitleCase(tblNames[i]) : tblNames[i];
                tables.add(new NyTable(tbl, db));

                const [colDefs, colFields] = await this.connection.query('DESCRIBE ' + tbl + ';');
                const cols = colDefs as mysql.RowDataPacket[];
                columns.set(tbl, this._mapToCols(cols));
            }

            schemaInfo.tables = Array.from(tables);
            schemaInfo.columns = columns;
            return schemaInfo;
        } else {
            return new NySchemaInfo();
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