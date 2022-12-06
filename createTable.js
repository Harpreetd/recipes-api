// creating table in Database
// needs to be run only once for creating a database if there is no existing database

const sqlite = require("sqlite3").verbose();
const db = new sqlite.Database(
  __dirname + "./storedRecipes.db",

  (err) => {
    if (err) return console.error(err);
  }
);

// CHANGE THE TABLE DEFINITION TO GET EARLIER TABLE STRUCTURE

// Recipes table
// const sql =
//   "CREATE TABLE IF NOT EXISTS Recipes(recipe_Id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,recipe_Name TEXT,step_Count INT, category TEXT)";
// db.run(sql);

// Ingredients Table
// const sql =
//   "CREATE TABLE IF NOT EXISTS Ingredients(ingredient_Id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,ingredient_Type Text UNIQUE)";
// db.run(sql);

// Measurements table
// const sql =
//   " CREATE TABLE IF NOT EXISTS Measurements(measure_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,measure TEXT,recipe_Id INT NOT NULL, FOREIGN KEY (recipe_Id) REFERENCES Recipes(recipe_Id))";
// db.run(sql);

// Steps Table
// const sql =
//   "CREATE TABLE IF NOT EXISTS  Steps(id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,step_Id INTEGER NOT NULL,recipe_Id INTEGER NOT NULL,step_detail TEXT, FOREIGN KEY (recipe_Id) REFERENCES Recipes(recipe_Id))";
// db.run(sql);

// Joining table
// const sql =
//   "CREATE TABLE IF NOT EXISTS AllTogether(id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,recipe_Id INTEGER NOT NULL,ingredient_Id INTEGER NOT NULL,measure_Id INTEGER NOT NULL,FOREIGN KEY (recipe_Id) REFERENCES Recipes(recipe_Id),FOREIGN KEY (ingredient_Id) REFERENCES Ingredients(ingredient_Id),FOREIGN KEY (measure_Id) REFERENCES Measurements(measure_Id))";
// db.run(sql);
