
import * as mysql from "mysql2/promise";
import * as tmysql from "mysql2";

class NyQLDatabaseConnection {

    private connection : mysql.Connection;
    private schema: Map<string, string[]>;

    async reloadConnection(options) {
        this.connection = await mysql.createConnection(options);
        return this.connection;
    }

    async loadSchema() : Promise<string[]> {
        const [rows, fields] = await this.connection.query('SHOW TABLES;');
        const colName = fields[0].name;
        this.schema = new Map<string, string[]>();

        if (rows instanceof Array) {
            const rs = rows as mysql.RowDataPacket[];
            const tblNames = rs.map(r => r[colName]);

            for (let i = 0; i < tblNames.length; i++) {
                const tbl = tblNames[i];
                const [colDefs, colFields] = await this.connection.query('DESCRIBE ' + tbl + ';');
                const cols = colDefs as mysql.RowDataPacket[];
                this.schema.set(tbl, cols.map(c => c['Field']));
            }
            return Promise.resolve(tblNames);

        } else {
            return Promise.resolve([]);
        }
    }

    getTables(): string[] {
        return Array.from(this.schema.keys());
    }

    getColumns(tableName: string): string[] {
        return this.schema.get(tableName);
    }

    validTableColumn(tableName: string, columnName: string): boolean {
        return this.schema.has(tableName) && this.schema.get(tableName).filter(c => c === columnName).length === 1;
    }

}

const instance : NyQLDatabaseConnection = new NyQLDatabaseConnection();

export default instance;