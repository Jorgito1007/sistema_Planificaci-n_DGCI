import "server-only";
import * as sql from "mssql";

const connStr = process.env.SQLSERVER_CONNECTION_STRING;

if (!connStr) {
  throw new Error("Falta SQLSERVER_CONNECTION_STRING en .env.local");
}

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
   poolPromise = sql.connect(connStr as string); // ✅ aquí ya no da error
  }
  return poolPromise;
}


export { sql };