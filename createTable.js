// creating table in Database
// needs to be run only once for creating a database if there is no existing database

const sqlite = require("sqlite3").verbose();
const db = new sqlite.Database(
  __dirname + "./recipeCollection.db",

  (err) => {
    if (err) return console.error(err);
  }
);

// const sql =
//   "CREATE TABLE IF NOT EXISTS RecipesList(recipeId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,recipeName TEXT, recipeCategory TEXT)";
// db.run(sql);

// const sql =
//   "CREATE TABLE IF NOT EXISTS IngredientsList(ingredientId INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,ingredientName Text)";
// db.run(sql);

// const sql =
// " CREATE TABLE IF NOT EXISTS RecipeIngredients(id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,recipeId INT, FOREIGN KEY (recipeId) REFERENCES RecipesList(recipeId))";
// db.run(sql);
