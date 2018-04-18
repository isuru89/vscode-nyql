import { NyTable, NyColumn, NyConnection, NyDatabase, NyDatabaseImpl, NySchemaInfo } from "./nyModel";
import { NyMySqlImpl } from "./db/ny-mysql";

const _DBS = {
    "mysql": new NyMySqlImpl()
}

class NyQLDatabaseConnection {

    private options: NyConnection;
    private dbImpl: NyDatabaseImpl;
    private schemaRef: NySchemaInfo;
    private schema: Map<string, string[]>;

    reloadConnection(options: NyConnection) {
        this.options = options;
        let dbImpl = _DBS[options.dialect.toLowerCase()] as NyDatabaseImpl;
        if (!dbImpl) {
            return Promise.reject(`No dialect is found for the name '${options.dialect}'!`)
        }

        return new Promise((resolve, reject) => {
            dbImpl.reloadConnection(options).then(impl => {
                this.dbImpl = impl
                resolve(impl);
            }).catch(err => {
                reject(err);
            })
        });
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
        return this.schema.has(tableName) && this.schema.get(tableName).filter(c => c === columnName).length === 1;
    }

}

const instance : NyQLDatabaseConnection = new NyQLDatabaseConnection();

export default instance;