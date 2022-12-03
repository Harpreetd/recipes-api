// creating table in Database
// needs to be run only once for creating a database if there is no existing database

const sqlite = require("sqlite3").verbose();
const db = new sqlite.Database(
  __dirname + "./recipe.db",

  (err) => {
    if (err) return console.error(err);
  }
);

const sql =
  "CREATE TABLE IF NOT EXISTS recipe(id INTEGER PRIMARY KEY AUTOINCREMENT,recipeName TEXT, recipeCategory TEXT)";
db.run(sql);
