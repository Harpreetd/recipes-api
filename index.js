const express = require("express"); // importing express from express module for request processing
const morgan = require("morgan");
const bodyParser = require("body-parser"); // importing body-parser
const hostname = "localhost"; // name of the server
const port = process.env.PORT || 8080; // port of the server
const app = express(); // creating an express app instance

app.use(morgan("dev"));
app.use(bodyParser.json()); //using body-parser to parse the request body

app.use(bodyParser.urlencoded({ extended: true }));
// connecting to the database
const sqlite = require("sqlite3").verbose();
const db = new sqlite.Database(__dirname + "./recipeCollection.db", (err) => {
  if (err) return console.error(err);
  console.log("connection created");
});
let sql;
// just for testing ---working
// app.get("/", (req, res) => {
//   return res.json({
//     recipeName: "pancakes",
//     recipeCategory: "free",
//   });
//   res.end();
// });

// get all recipes
// app.get("/recipe", (req, res) => {
//   sql = "SELECT * FROM Recipes WHERE recipe_Name='Pancakes'";
//   console.log(sql);
//   try {
// db.serialize(()=>{

//     db.run(sql, [], (err, rows) => {
//       console.log("result of sql", rows);
//       if (err) return res.json({ status: 300, success: false, error: err });
//       if (rows.length < 1)
//         return res.json({
//           status: 300,
//           success: false,
//           error: "no match found",
//         });
//       return res.json({ status: 200, data: rows, success: true });
//     });
//   } catch (error) {
//     return res.json({
//       status: 404,
//       error: error,
//       success: false,
//     });
// })
//   }
// });

// get all recipes
app.get("/recipe", (req, res) => {
  let data = [];
  db.serialize(() => {
    db.each(
      "SELECT * FROM Recipes;",
      (err, row) => {
        if (err) return res.json({ status: 300, success: false, error: err });
        console.log(row.recipe_Name);
        data.push(row);
      },
      () => {
        res.send(data);
      }
    );
  });
});
//  `SELECT * FROM Recipes WHERE recipe_Id= ${recipeId};`,
// const getRecipeIngredients =
//   "SELECT r.recipe_Name, i.ingredient_Name from Recipes r inner JOIN RecipeIngredients t on r.recipe_Id= t.recipe_Id inner join Ingredients i on t.ingredient_Id = i.ingredient_Id;";
// Get a particular recipe
app.get("/recipe/:recipe_Id", (req, res) => {
  let recipeId = req.params.recipe_Id;
  let data;
  let recipeName;
  let stepsCount;
  let ingredients = [];
  db.serialize(() => {
    db.each(
      `SELECT r.recipe_Name,r.step_Count, i.ingredient_Type, m.measure from Recipes r inner JOIN RecipeIngredients t on r.recipe_Id= t.recipe_Id inner join Ingredients i on t.ingredient_Id = i.ingredient_Id inner JOIN Measurements m on m.measure_Id=t.measure_Id WHERE r.recipe_Id=${recipeId};`,

      (err, row) => {
        if (err) return res.json({ status: 300, success: false, error: err });
        console.log(row);
        recipeName = row.recipe_Name;
        stepsCount = row.step_Count;
        let measureText = row.measure;
        let ingredientType = row.ingredient_Type;
        let ingredient = { type: ingredientType, amount: measureText };
        console.log(ingredient);
        ingredients.push(ingredient);
        data = {
          recipeName: recipeName,
          ingredients: [...ingredients],
          stepCount: stepsCount,
        };
        // data.push(row);
      },
      () => {
        res.send(data);
      }
    );
  });
});
// for retrieving ingredients of a recipe

// select * from Recipes Where recipe_Name = "Pancakes";
// SELECT * from Ingredients;
// select * from RecipeIngredients;

// SELECT r.recipe_Name, i.ingredient_Name
// from Recipes r inner JOIN RecipeIngredients t on r.recipe_Id= t.recipe_Id
// inner join Ingredients i on t.ingredient_Id = i.ingredient_Id;

// Server listening
app.listen(port, () => {
  console.log(`server is running at http://${hostname}:${port}`);
});
