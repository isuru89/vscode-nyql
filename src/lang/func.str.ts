import { MiscFunctionDefinition } from "./func.misc";

export const STR_FUNCTIONS: Array<MiscFunctionDefinition> = [
  {
    name: 'CONCAT',
    description: 'Concatenates arbitary number of columns/strings together.\n Warn: Ignorance of NULL columns are dependent on the db type.',
    snippet: 'CONCAT(${1:col1}, ${2:val1}, ${3:col2})'
  },
  {
    name: 'CONCAT_NN',
    description: 'Concatenates arbitary number of columns/strings together ignoring NULL columns.',
    snippet: 'CONCAT(${1:col1}, ${2:val1}, ${3:col2})',
    since: '2.0'
  },
  {
    name: 'CONCAT_WS',
    description: 'Concatenates arbitary number of columns/strings together with given separator.\n Ignorance of NULL columns are dependent on db type.',
    snippet: 'CONCAT_WS(STR(${1:separator}), ${2:col1}, ${3:col2})',
    since: '2.0'
  },
  {
    name: 'LCASE',
    description: 'Converts column value to lower case.',
    snippet: 'LCASE(${1:column})'
  },
  {
    name: 'LEFT_PAD',
    description: 'Left pad given column to the specified length using given text. If the text is undefined, then will use a space.',
    snippet: 'LEFT_PAD(${1:column}, NUM(${2:length}))'
  },
  {
    name: 'LEFT_TRIM',
    description: 'Left trim whitespaces from a column.',
    snippet: 'LEFT_TRIM(${1:column})'
  },
  {
    name: 'LEN',
    description: 'Length of a column of string.',
    snippet: 'LEN(${1:col})'
  },
  {
    name: 'POSITION',
    description: 'Find the position of substring in the given string case sensitively. If the text is not found, returns 0. Position value is always >= 1',
    snippet: "POSITION(${1:column}, STR('${2:textToFind}'))"
  },
  {
    name: 'POSITION_LAST',
    description: 'Find the last occurred position of substring in the given string case sensitively. If the text is not found, returns 0. Position value is always >= 1',
    snippet: "POSITION(${1:column}, STR('${2:textToFind}'))",
    since: '2.0'
  },
  {
    name: 'REPEAT',
    description: 'Repeats the string given amount of time',
    snippet: 'REPEAT(${1:column}, NUM(${2:numOfTime}))'
  },
  {
    name: 'REVERSE',
    description: 'Reverse a string',
    snippet: 'REVERSE(${1:column})'
  },
  {
    name: 'RIGHT_PAD',
    description: 'Right pad given column to the specified length using given text. If the text is undefined, then will use a space.',
    snippet: 'RIGHT_PAD(${1:column}, NUM(${2:length}))'
  },
  {
    name: 'RIGHT_TRIM',
    description: 'Right trim whitespaces from a column.',
    snippet: 'RIGHT_TRIM(${1:column})'
  },
  {
    name: 'STR_LEFT',
    description: 'Capture specified length from the given string starting from left',
    snippet: 'STR_LEFT(${1:column}, NUM(${2:length}))'
  },
  {
    name: 'STR_RIGHT',
    description: 'Capture specified length from the given string starting from right',
    snippet: 'STR_RIGHT(${1:column}, NUM(${2:length}))'
  },
  {
    name: 'STR_REPLACE',
    description: "Replace a string of all 'from' text to 'to'. Both 'from' and 'to' are 1-based indices.",
    snippet: "STR_REPLACE(${1:column}, STR('${2:findStr}'), STR('${2:replaceStr}'))"
  },
  {
    name: 'SUBSTRING',
    description: 'Capture part of a string starting from given location to the given length',
    snippet: 'SUBSTRING(${1:column}, NUM(${2:startFrom}), NUM(${3:endTo}))'
  },
  {
    name: 'TRIM',
    description: 'Trims whitespace from the column',
    snippet: 'TRIM(${1:column})'
  },
  {
    name: 'UCASE',
    description: 'Converts string to upper case',
    snippet: 'UCASE(${1:column})'
  }
]