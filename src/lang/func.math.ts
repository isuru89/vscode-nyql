import { MiscFunctionDefinition } from "./func.misc";

export const MATH_FUNCTIONS: Array<MiscFunctionDefinition> = [
  {
    name: 'ADD', description: 'Adds two columns together',
    snippet: 'ADD(${1:col}, ${2:col2})'
  },
  {
    name: 'MINUS', description: 'Subtract two columns colLeft - colRight',
    snippet: 'MINUS(${1:colLeft}, ${2:colRight})'
  },
  {
    name: 'MULTIPLY', description: 'Multiply two columns/values',
    snippet: 'MULTIPLY(${1:colLeft}, ${2:colRight})'
  },
  {
    name: 'DIVIDE', description: 'Divide two columns/values',
    snippet: 'DIVIDE(${1:colNumerator}, ${2:colDenominator})'
  },
  {
    name: 'MODULUS', description: 'Equivalent to column % value',
    snippet: 'MODULUS(${1:column}, ${2:divideValue})'
  },
  {
    name: 'INVERSE', description: 'Equivalent to 1 / column.',
    snippet: 'INVERSE(${1:column})'
  },
  {
    name: 'BITAND', description: 'Bit AND operator.',
    snippet: 'BITAND(${1:colLeft}, ${2:colRight})'
  },
  {
    name: 'BITOR', description: 'Bit OR operator',
    snippet: 'BITOR(${1:colLeft}, ${2:colRight})'
  },
  {
    name: 'BITXOR', description: 'Bit XOR operator',
    snippet: 'BITXOR(${1:colLeft}, ${2:colRight})'
  },
  {
    name: 'BITNOT', description: 'Bit NOT operator',
    snippet: 'BITNOT(${1:colLeft}, ${2:colRight})'
  },

  {
    name: 'ABS',
    description: 'Gets the absolute value of a real number',
    snippet: 'ABS(${1:numberColumn})'
  },
  {
    name: 'ACOS', description: 'Returns the arc cosine for given value. The value must be between -1 and 1.',
    snippet: 'ACOS(${1:column})', 
    since: '2.0'
  },
  {
    name: 'ASIN', description: 'Returns the arc sine for given value. The value must be between -1 and 1.',
    snippet: 'ASIN(${1:column})', 
    since: '2.0'
  },
  {
    name: 'ATAN', description: 'Returns the arc tangent for given value.',
    snippet: 'ATAN(${1:column})', 
    since: '2.0'
  },
  {
    name: 'ATAN2', description: 'Returns the arc tangent for given value. Equivalent to arc tangent of x/y.',
    snippet: 'ATAN2(${1:columnX}, ${2:columnY})', 
    since: '2.0'
  },
  {
    name: 'CEIL',
    description: 'Gets the ceiling value of decimal number',
    snippet: 'CEIL(${1:decimalColumn})'
  },
  {
    name: 'COS', description: 'Returns the cosine for given value.',
    snippet: 'COS(${1:radiansColumn})', 
    since: '2.0'
  },
  {
    name: 'COT', description: 'Returns the cotangent for given value. Equivalent, 1 / TAN(x).',
    snippet: 'COT(${1:column})', 
    since: '2.0'
  },
  {
    name: 'DEGREES',
    description: 'Converts given radian value to degrees',
    snippet: 'DEGREES(${1:decimalColumn})'
  },
  {
    name: 'EXP', description: 'Returns value of \"e\" raised to the given power.',
    snippet: 'EXP(${1:power})', 
    since: '2.0'
  },
  {
    name: 'FLOOR',
    description: 'Gets the floor value of decimal number',
    snippet: 'FLOOR(${1:decimalColumn})'
  },
  {
    name: 'LOG', description: 'Returns logarithm of value to the given base.',
    snippet: 'LOG(${1:base}, ${2:value})', 
    since: '2.0'
  },
  {
    name: 'LOGE', description: 'Returns natural logarithm of given value.',
    snippet: 'LOGE(${2:value})', 
    since: '2.0'
  },
  {
    name: 'POWER',
    description: 'Raise the given column value to the given magnitude.',
    snippet: 'POWER(${1:decimalColumn}, ${2:magnitude})'
  },
  {
    name: 'RADIANS',
    description: 'Converts given degree value to radians.',
    snippet: 'RADIANS(${1:decimalColumn})'
  },
  {
    name: 'ROUND',
    description: 'Round the given number to specified decimal places.',
    snippet: 'ROUND(${1:decimalColumn}, ${2:decimalPlaces})'
  },
  {
    name: 'SIGN',
    description: 'Returns the sign value as an integer of the given column value (-1,0,+1).',
    snippet: 'SIGN(${1:decimalColumn})'
  },
  {
    name: 'SIN', description: 'Returns the sine value of given radians.',
    snippet: 'SIN(${1:column})', 
    since: '2.0'
  },
  {
    name: 'SQRT',
    description: 'Returns the sign value as an integer of the given column value (-1,0,+1).',
    snippet: 'SQRT(${1:decimalColumn})'
  },
  {
    name: 'STDDEV_POP', description: 'Population standard deviation of values in given column.',
    snippet: 'STDDEV_POP(${1:column})', 
    since: '2.0'
  },
  {
    name: 'STDDEV_SAMP', description: 'Sample standard deviation of values in given column.',
    snippet: 'STDDEV_SAMP(${1:column})', 
    since: '2.0'
  },
  {
    name: 'VAR_POP', description: 'Population variance of values in given column.',
    snippet: 'VAR_POP(${1:column})', 
    since: '2.0'
  },
  {
    name: 'VAR_SAMP', description: 'Sample variance of values in given column.',
    snippet: 'VAR_SAMP(${1:column})', 
    since: '2.0'
  },
  {
    name: 'TAN', description: 'Returns the tangent for the given value.',
    snippet: 'TAN(${1:column})', 
    since: '2.0'
  },
  {
    name: 'TRUNCATE',
    description: "Truncate the given decimal number to 'd decimal places. This does not 'round' the number. Negative 'd' values will truncate before the decimal point.",
    snippet: 'TRUNCATE(${1:decimalColumn}, ${2:decimalPlaces})'
  },
]