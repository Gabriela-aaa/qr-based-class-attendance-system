const { pool } = require("../config/database");

class BaseModel {
  static get pool() {
    return pool;
  }

  /**
   * Run a parameterized query against the pool.
   * @param {string} sql
   * @param {any[]} params
   */
  static async query(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows;
  }
}

module.exports = BaseModel;

