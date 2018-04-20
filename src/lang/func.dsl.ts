export interface DslFunctionDefinition {
  name: string,
  description: string
}

export const DSL_FUNCTIONS: Array<DslFunctionDefinition> = [
  {
    name: 'insert',
    description: 'NyQL Insert query',
  } as DslFunctionDefinition,
  {
    name: 'update',
    description: 'NyQL Update query'
  } as DslFunctionDefinition,
  {
    name: 'select',
    description: 'NyQL Select query'
  } as DslFunctionDefinition,
  {
    name: 'delete',
    description: 'NyQL Delete query'
  } as DslFunctionDefinition,
  {
    name: 'insertOrLoad',
    description: 'NyQL Insert Or Load query.'
  } as DslFunctionDefinition,
  {
    name: 'upsert',
    description: 'NyQL Upsert query'
  } as DslFunctionDefinition,
  {
    name: 'truncate',
    description: 'NyQL Truncate query'
  } as DslFunctionDefinition,
  {
    name: 'bulkInsert',
    description: 'NyQL Batch Insert query'
  } as DslFunctionDefinition,
  {
    name: 'bulkDelete',
    description: 'NyQL Batch Delete query'
  } as DslFunctionDefinition,
  {
    name: 'bulkUpdate',
    description: 'NyQL Batch Update query'
  } as DslFunctionDefinition,
  {
    name: 'script',
    description: 'NyQL Custom script.'
  } as DslFunctionDefinition,
  {
    name: 'union',
    description: 'NyQL Union query'
  } as DslFunctionDefinition,
  {
    name: 'unionDistinct',
    description: 'NyQL Union only with distincts query'
  } as DslFunctionDefinition,
  {
    name: 'cte',
    description: 'NyQL Common Table Expression query'
  } as DslFunctionDefinition,
  {
    name: 'dbFunction',
    description: 'NyQL Call Database Stored-Procedure'
  } as DslFunctionDefinition,
  
]