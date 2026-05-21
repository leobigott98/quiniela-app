import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 5,
      namedPlaceholders: true,
      timezone: "Z",
    });
  }
  return pool;
}

export async function query<T>(sql: string, params: Record<string, unknown> = {}) {
  const [rows] = await getPool().execute(sql, params);
  return rows as T[];
}

export async function transaction<T>(fn: (conn: mysql.PoolConnection) => Promise<T>) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
