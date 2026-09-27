import pg from "pg";

const {Pool} = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

export async function checkDatabaseConnection() {
    await pool.query("SELECT 1");
}

export default pool;