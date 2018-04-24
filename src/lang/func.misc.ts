export interface MiscFunctionDefinition {
  name: string,
  description?: string,
  snippet: string,
  since?: string
}

export const MISC_FUNCTIONS: Array<MiscFunctionDefinition> = [
  {
    name: 'COALESCE',
    snippet: 'COALESCE(${1:col1}, ${2:const})'
  },
  {
    name: 'LEAST',
    description: 'Returns the lowest value from given two values/columns.',
    snippet: 'LEAST(${1:val1}, ${2:val2})'
  },
  {
    name: 'GREATEST',
    description: 'Returns the greatest value from given two values/columns.',
    snippet: 'LEAST(${1:val1}, ${2:val2})'
  },

  {
    name: 'CAST_BIGINT',
    description: 'Cast given column value to a unsigned big integer (long value).',
    snippet: 'CAST_BIGINT(${1:column})',
    since: '2.0'
  },
  {
    name: 'CAST_STR',
    description: 'Cast given column value to a string with specified length',
    snippet: 'CAST_STR(${1:column}, NUM(${2:length}))',
    since: '2.0'
  },
  {
    name: 'CAST_INT',
    description: 'Cast given column value to a integer.',
    snippet: 'CAST_INT(${1:column})'
  },
  {
    name: 'CAST_STR',
    description: 'Cast given column value to a string.',
    snippet: 'CAST_STR(${1:column})'
  },
  {
    name: 'CAST_DATE',
    description: 'Cast given column value to a date.',
    snippet: 'CAST_DATE(${1:column})'
  },

  {
    name: 'ASC',
    description: 'Ascending order of given column.',
    snippet: 'ASC(${1:column})'
  },
  {
    name: 'DESC',
    description: 'Descending order of given column.',
    snippet: 'DESC(${1:column})'
  },

  {
    name: 'COUNT',
    description: 'Count of all grouped columns.',
    snippet: 'COUNT(${1:column})'
  },
  {
    name: 'COUNT',
    description: 'Count of all table.',
    snippet: 'COUNT()'
  },
  {
    name: 'MAX', description: 'Maximumn from all records in given column.',
    snippet: 'MAX(${1:column})'
  },
  {
    name: 'MIN', description: 'Minimum from all records in given column.',
    snippet: 'MIN(${1:column})'
  },
  {
    name: 'AVG', description: 'Average of all records in given column.',
    snippet: 'AVG(${1:column})'
  },
  {
    name: 'SUM', description: 'Sum value of all records in given column.',
    snippet: 'SUM(${1:column})'
  },
  {
    name: 'DISTINCT', description: 'Distinct of all records in given column.',
    snippet: 'DISTINCT(${1:column})'
  },
  {
    name: 'DISTINCT', description: 'Distinct all.',
    snippet: 'DISTINCT()'
  },
]