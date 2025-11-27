import { dbAll, dbRun, dbExec, getListTablesQuery, getSampleRowsQuery, getCountQuery } from '../db/index.js';
import { formatErrorResponse, formatSuccessResponse, convertToCSV } from '../utils/formatUtils.js';

const DEFAULT_SAMPLE_LIMIT = 50;

async function ensureTableExists(tableName: string) {
  if (!tableName || !/^[A-Za-z0-9_]+$/.test(tableName)) {
    throw new Error("Invalid table name");
  }

  const tables = await dbAll(getListTablesQuery());
  const names = tables.map((t) => t.name || t.TABLE_NAME || t.table_name);
  if (!names.includes(tableName)) {
    throw new Error(`Table '${tableName}' does not exist`);
  }
}

/**
 * Execute a read-only SQL query
 * @param query SQL query to execute
 * @returns Query results
 */
export async function readQuery(query: string) {
  try {
    if (!query.trim().toLowerCase().startsWith("select")) {
      throw new Error("Only SELECT queries are allowed with read_query");
    }

    const result = await dbAll(query);
    return formatSuccessResponse(result);
  } catch (error: any) {
    throw new Error(`SQL Error: ${error.message}`);
  }
}

/**
 * Get a limited set of rows from a table with safety checks
 */
export async function sampleRows(tableName: string, limit?: number) {
  const safeLimit = limit && limit > 0 ? Math.min(limit, 200) : DEFAULT_SAMPLE_LIMIT;
  await ensureTableExists(tableName);
  const query = getSampleRowsQuery(tableName, safeLimit);
  const rows = await dbAll(query);
  return formatSuccessResponse(rows);
}

/**
 * Get a count of rows in a table
 */
export async function countTable(tableName: string) {
  await ensureTableExists(tableName);
  const query = getCountQuery(tableName);
  const rows = await dbAll(query);
  return formatSuccessResponse(rows[0]);
}

/**
 * Execute a data modification SQL query
 * @param query SQL query to execute
 * @returns Information about affected rows
 */
export async function writeQuery(query: string) {
  try {
    const lowerQuery = query.trim().toLowerCase();
    
    if (lowerQuery.startsWith("select")) {
      throw new Error("Use read_query for SELECT operations");
    }
    
    if (!(lowerQuery.startsWith("insert") || lowerQuery.startsWith("update") || lowerQuery.startsWith("delete"))) {
      throw new Error("Only INSERT, UPDATE, or DELETE operations are allowed with write_query");
    }

    const result = await dbRun(query);
    return formatSuccessResponse({ affected_rows: result.changes });
  } catch (error: any) {
    throw new Error(`SQL Error: ${error.message}`);
  }
}

/**
 * Export query results to CSV or JSON format
 * @param query SQL query to execute
 * @param format Output format (csv or json)
 * @returns Formatted query results
 */
export async function exportQuery(query: string, format: string) {
  try {
    if (!query.trim().toLowerCase().startsWith("select")) {
      throw new Error("Only SELECT queries are allowed with export_query");
    }

    const result = await dbAll(query);
    
    if (format === "csv") {
      const csvData = convertToCSV(result);
      return {
        content: [{ 
          type: "text", 
          text: csvData
        }],
        isError: false,
      };
    } else if (format === "json") {
      return formatSuccessResponse(result);
    } else {
      throw new Error("Unsupported export format. Use 'csv' or 'json'");
    }
  } catch (error: any) {
    throw new Error(`Export Error: ${error.message}`);
  }
} 
