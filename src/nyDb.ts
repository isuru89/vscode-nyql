import { NyTable, NyColumn, NyConnection, NyDatabase, NyDatabaseImpl, NySchemaInfo } from "./nyModel";
import { NyMySqlImpl } from "./db/ny-mysql";
import { Disposable } from "vscode";

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

    async reloadConnection(options: NyConnection) {
        this.options = options;
        let dbImpl = _DBS[options.dialect.toLowerCase()] as NyDatabaseImpl;
        if (!dbImpl) {
            return Promise.reject(`No dialect is found for the name '${options.dialect}'!`)
        }

        this.dbImpl = await dbImpl.reloadConnection(options);
    }

    async close() {
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
        return Array.from(this.schema.keys());
    }

    getColumns(tableName: string): string[] {
        return this.schema.get(tableName);
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