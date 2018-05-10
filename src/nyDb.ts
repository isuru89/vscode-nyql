import { NyTable, NyColumn, NyConnection, NyDatabase, NyDatabaseImpl, NySchemaInfo } from "./nyModel";
import { NyMySqlImpl } from "./db/ny-mysql";
import { Disposable } from "vscode";
import nyClient from "./client/nyClient";

const _DBS = {
    "mysql": new NyMySqlImpl()
}

export class NyQLDatabaseConnection {

    // @TODO keep track of foreign keys

    private options: NyConnection;
    private dbImpl: NyDatabaseImpl;
    private schemaRef: NySchemaInfo;
    private schema: Map<string, string[]>;

    getNyConnection() {
        return this.options;
    }

    loadDatabaseNames(con: NyConnection) {
        let dbImpl = _DBS[con.dialect.toLowerCase()] as NyDatabaseImpl;
        if (!dbImpl) {
            return Promise.reject(`No dialect is found for the name '${con.dialect}'!`)
        }
        return dbImpl.fetchDatabases(con);
    }

    async reloadConnection(options: NyConnection) {
        this.options = options;
        let dbImpl = _DBS[options.dialect.toLowerCase()] as NyDatabaseImpl;
        if (!dbImpl) {
            return Promise.reject(`No dialect is found for the name '${options.dialect}'!`)
        }

        this.dbImpl = await dbImpl.reloadConnection(options);
    }

    isClosed(): boolean {
        return this.dbImpl === null;
    }

    async close() {
        try {
            await nyClient.sendMessage({
                cmd: 'remove',
                name: this.options.name
            });
        } catch (err) {
            console.log("Error closing nyql connection!");
        }

        if (this.dbImpl) {
            this.dbImpl.close();
        }
        this.options = null;
        this.dbImpl = null;
        this.schemaRef = null;
        if (this.schema) {
            this.schema.clear();
        }
    }

    async loadSchema() {
        let schema = await this.dbImpl.loadSchema();
        this.schemaRef = schema;

        this.schema = new Map<string, string[]>();
        this.schemaRef.tables.forEach(t => {
            this.schema.set(t.name, this.schemaRef.columns.get(t.name).map(c => c.name));
        });
    }

    getTables(): string[] {
        if (this.schema) {
            return Array.from(this.schema.keys());
        } else {
            return [];
        }
    }

    getColumns(tableName: string): string[] {
        if (this.schema) {
            return this.schema.get(tableName);
        } else {
            return [];
        }
    }

    getColumn(tableName: string, columnName: string) : NyColumn {
        const _tmp = this.schemaRef.columns.get(tableName).filter(c => c.name == columnName);
        if (_tmp && _tmp.length > 0) {
            return _tmp[0];
        } else {
            return null;
        }
    }

    validTableColumn(tableName: string, columnName: string): boolean {
        if (this.schema.has(tableName)) {
            return this.schema.get(tableName).filter(c => c === columnName).length === 1;
        } else {
            const tbName = tableName.toLowerCase();
            return this.schema.has(tbName) && this.schema.get(tbName).filter(c => c == columnName).length === 1;
        }
    }

}