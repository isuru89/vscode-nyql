import { MiscFunctionDefinition } from "./func.misc";

export const TIME_FUNCTIONS: Array<MiscFunctionDefinition> = [
  {
    name: 'NOW',
    description: 'Current timestamp with both date and time',
    snippet: 'NOW()'
  },
  {
    name: 'CURRENT_DATE',
    description: 'Current date without time',
    snippet: 'CURRENT_DATE()'
  },
  {
    name: 'CURRENT_TIME',
    description: 'Current time without date',
    snippet: 'CURRENT_TIME()'
  },
  {
    name: 'CURRENT_EPOCH',
    description: 'Current epoch milliseconds',
    snippet: 'CURRENT_EPOCH()'
  },
  {
    name: 'EPOCH_TO_DATE',
    description: 'Convert epoch milliseconds to date',
    snippet: 'EPOCH_TO_DATE(${1:column})'
  },
  {
    name: 'EPOCH_TO_DATETIME',
    description: 'Convert epoch milliseconds to date time',
    snippet: 'EPOCH_TO_DATETIME(${1:column})'
  },
  {
    name: 'DATE_TRUNC',
    description: 'Truncate a date time to date by removing time part',
    snippet: 'DATE_TRUNC(${1:col1})',
  },
  {
    name: 'DATE_DIFF_YEARS', description: 'Difference between two dates in years',
    snippet: 'DATE_DIFF_YEARS(${1:startDateTimeColumn}, ${2:endDateTimeColumn})',
  },
  {
    name: 'DATE_DIFF_MONTHS', description: 'Difference between two dates in months',
    snippet: 'DATE_DIFF_MONTHS(${1:startDateTimeColumn}, ${2:endDateTimeColumn})',
  },
  {
    name: 'DATE_DIFF_DAYS', description: 'Difference between two dates in days',
    snippet: 'DATE_DIFF_DAYS(${1:startDateTimeColumn}, ${2:endDateTimeColumn})',
  },
  {
    name: 'DATE_DIFF_WEEKS', description: 'Difference between two dates in weeks',
    snippet: 'DATE_DIFF_WEEKS(${1:startDateTimeColumn}, ${2:endDateTimeColumn})',
  },
  {
    name: 'DATE_DIFF_HOURS', description: 'Difference between two dates in hours',
    snippet: 'DATE_DIFF_HOURS(${1:startDateTimeColumn}, ${2:endDateTimeColumn})',
  },
  {
    name: 'DATE_DIFF_MINUTES', description: 'Difference between two dates in minutes',
    snippet: 'DATE_DIFF_MINUTES(${1:startDateTimeColumn}, ${2:endDateTimeColumn})',
  },
  {
    name: 'DATE_DIFF_SECONDS', description: 'Difference between two dates in seconds',
    snippet: 'DATE_DIFF_SECONDS(${1:startDateTimeColumn}, ${2:endDateTimeColumn})',
  },
  {
    name: 'DATE_ADD_YEARS', description: 'Add given number of years to the start date',
    snippet: 'DATE_DIFF_YEARS(${1:startDateTimeColumn}, NUM(${2:by}))',
  },
  {
    name: 'DATE_ADD_MONTHS', description: 'Add given number of months to the start date',
    snippet: 'DATE_ADD_MONTHS(${1:startDateTimeColumn}, NUM(${2:by}))',
  },
  {
    name: 'DATE_ADD_DAYS', description: 'Add given number of days to the start date',
    snippet: 'DATE_ADD_DAYS(${1:startDateTimeColumn}, NUM(${2:by}))',
  },
  {
    name: 'DATE_ADD_WEEKS', description: 'Add given number of weeks to the start date',
    snippet: 'DATE_ADD_WEEKS(${1:startDateTimeColumn}, NUM(${2:by}))',
  },
  {
    name: 'DATE_ADD_HOURS', description: 'Add given number of hours to the start date',
    snippet: 'DATE_ADD_HOURS(${1:startDateTimeColumn}, NUM(${2:by}))',
  },
  {
    name: 'DATE_ADD_MINUTES', description: 'Add given number of minutes to the start date',
    snippet: 'DATE_ADD_MINUTES(${1:startDateTimeColumn}, NUM(${2:by}))',
  },
  {
    name: 'DATE_ADD_SECONDS', description: 'Add given number of seconds to the start date',
    snippet: 'DATE_ADD_SECONDS(${1:startDateTimeColumn}, NUM(${2:by}))',
  },
  {
    name: 'DATE_SUB_YERAS', description: 'Subtract given number of years from the start date',
    snippet: 'DATE_SUB_YERAS(${1:startDateTimeColumn}, NUM(${2:by}))',
  },
  {
    name: 'DATE_SUB_MONTHS', description: 'Subtract given number of months from the start date',
    snippet: 'DATE_SUB_MONTHS(${1:startDateTimeColumn}, NUM(${2:by}))',
  },
  {
    name: 'DATE_SUB_DAYS', description: 'Subtract given number of days from the start date',
    snippet: 'DATE_SUB_DAYS(${1:startDateTimeColumn}, NUM(${2:by}))',
  },
  {
    name: 'DATE_SUB_WEEKS', description: 'Subtract given number of weeks from the start date',
    snippet: 'DATE_SUB_WEEKS(${1:startDateTimeColumn}, NUM(${2:by}))',
  },
  {
    name: 'DATE_SUB_HOURS', description: 'Subtract given number of hours from the start date',
    snippet: 'DATE_SUB_HOURS(${1:startDateTimeColumn}, NUM(${2:by}))',
  },
  {
    name: 'DATE_SUB_MINUTES', description: 'Subtract given number of minutes from the start date',
    snippet: 'DATE_SUB_MINUTES(${1:startDateTimeColumn}, NUM(${2:by}))',
  },
  {
    name: 'DATE_SUB_SECONDS', description: 'Subtract given number of seconds from the start date',
    snippet: 'DATE_SUB_SECONDS(${1:startDateTimeColumn}, NUM(${2:by}))',
  }
]