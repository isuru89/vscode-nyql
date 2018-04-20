export interface DslConstantDefinition {
  name: string;
  description: string;
  filterText: string;
  insertText: string;
}

export const DSL_CONSTANTS: Array<DslConstantDefinition> = [
  {
    name: '$DSL',
    description: 'Starting point for all query clauses',
    filterText: '$DSL',
    insertText: 'DSL'
  } as DslConstantDefinition,
  {
    name: '$SESSION',
    description: 'Retrieves session variables.',
    filterText: '$SESSION',
    insertText: 'SESSION'
  } as DslConstantDefinition,
  {
    name: '$DB',
    description: 'Activated database name.',
    filterText: '$DB',
    insertText: 'DB'
  } as DslConstantDefinition,
];