export class NyConnection {
    dialect: string;
    host: string;
    port: number;
    username: string;
    password: string;
    databaseName: string;
    
    additionalOptions?: string;
}

export class NySchemaInfo {
    database: NyDatabase;
    tables: Array<NyTable>;
    columns: Map<string, Array<NyColumn>>;
}

export interface NyDatabaseImpl {
    reloadConnection(connectionInfo: NyConnection) : Promise<NyDatabaseImpl>;

    loadSchema() : Promise<NySchemaInfo>;
}

export class NyDatabase {
    name: string;

    constructor(name: string) {
        this.name = name;
    } 
}

export class NyTable {
    name: string;
    database: NyDatabase;

    constructor(name: string, db: NyDatabase) {
        this.name = name;
        this.database = db;
    }
}

export class NyColumn {
    name: string;
    tableName: string;
    table: NyTable;
    type: string
}