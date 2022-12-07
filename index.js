const express = require("express"); // importing express from express module for request processing
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const sessions = require("express-session");
const bodyParser = require("body-parser"); // importing body-parser
const hostname = "localhost"; // name of the server
const port = process.env.PORT || 8080; // port of the server
const app = express(); // creating an express app instance

app.use(morgan("dev"));
app.use(bodyParser.json()); //using body-parser to parse the request body

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  sessions({
    secret: "food monster",
    saveUninitialized: true,
    cookie: { maxAge: 6000 },
    resave: false,
    secure: false,
  })
);

// connecting to the database
const sqlite = require("sqlite3").verbose();
const db = new sqlite.Database(__dirname + "./recipeCollection.db", (err) => {
  if (err) return console.error(err);
  console.log("connection created");
});
// let sql;
// get Premium user authorization
app.get("/", (req, res) => {
  res.cookie("usertype", "premium");
  res.end();
});

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
  if (req.cookies.usertype === "premium" || req.cookies.usertype === "admin") {
    db.serialize(() => {
      db.each(
        "SELECT * FROM Recipes;",
        (err, row) => {
          if (err) return res.json({ status: 300, success: false, error: err });
          data.push(row);
        },
        () => {
          res.send(data);
        }
      );
    });
  } else {
    db.serialize(() => {
      db.each(
        "SELECT * FROM Recipes WHERE category='Free';",
        (err, row) => {
          if (err) return res.json({ status: 300, success: false, error: err });
          data.push(row);
        },
        () => {
          if (data.length < 1)
            return res.json({
              status: 404,
              success: false,
              error: "No recipes Found, try again later.",
            });
          return res.json({ status: 200, data: data, success: true });
        }
      );
    });
  }
});

// FREE TIER
// Get a particular recipe
app.get("/recipe/:recipe_Id", (req, res) => {
  let recipeId = req.params.recipe_Id;
  let data;
  let recipeName;
  let stepsCount;
  let ingredients = [];
  if (req.cookies.usertype === "premium" || req.cookies.usertype === "admin") {
    db.serialize(() => {
      db.each(
        `SELECT r.recipe_Name,r.step_Count, i.ingredient_Type, m.measure from Recipes r inner JOIN RecipeIngredients t on r.recipe_Id= t.recipe_Id inner join Ingredients i on t.ingredient_Id = i.ingredient_Id inner JOIN Measurements m on m.measure_Id=t.measure_Id WHERE r.recipe_Id=?;`,
        recipeId,
        (err, row) => {
          if (err) return res.json({ status: 300, success: false, error: err });

          recipeName = row.recipe_Name;
          stepsCount = row.step_Count;
          let measureText = row.measure;
          let ingredientType = row.ingredient_Type;
          let ingredient = { type: ingredientType, amount: measureText };
          ingredients.push(ingredient);
          data = {
            recipeName: recipeName,
            ingredients: [...ingredients],
            stepCount: stepsCount,
          };
        },
        () => {
          res.send(data);
        }
      );
    });
  } else {
    db.serialize(() => {
      db.each(
        `SELECT r.recipe_Name,r.step_Count, i.ingredient_Type, m.measure from Recipes r inner JOIN RecipeIngredients t on r.recipe_Id= t.recipe_Id inner join Ingredients i on t.ingredient_Id = i.ingredient_Id inner JOIN Measurements m on m.measure_Id=t.measure_Id WHERE r.recipe_Id=? AND r.category='Free';`,
        recipeId,
        (err, row) => {
          if (err) return res.json({ status: 300, success: false, error: err });

          recipeName = row.recipe_Name;
          stepsCount = row.step_Count;
          let measureText = row.measure;
          let ingredientType = row.ingredient_Type;
          let ingredient = { type: ingredientType, amount: measureText };
          ingredients.push(ingredient);
          data = {
            recipeName: recipeName,
            ingredients: [...ingredients],
            stepCount: stepsCount,
          };
        },
        () => {
          if (!data)
            return res.json({
              status: 401,
              success: false,
              error: "Unauthorized user, get a premium user token to continue",
            });
          return res.json({ status: 200, data: data, success: true });
        }
      );
    });
  }
});

// get detailed steps of a given recipe
app.get("/recipe/:recipe_Id/all", (req, res) => {
  let recipeId = req.params.recipe_Id;
  let data = [];
  if (req.cookies.usertype === "premium" || req.cookies.usertype === "admin") {
    db.serialize(() => {
      db.each(
        `SELECT s.step_detail,s.step_Id FROM Steps s INNER JOIN Recipes r ON r.recipe_Id=s.recipe_Id WHERE r.recipe_Id=(?);`,
        recipeId,
        (err, row) => {
          if (err) return res.json({ status: 300, success: false, error: err });
          data.push({ stepId: row.step_Id, text: row.step_detail });
        },
        () => {
          res.send(data);
        }
      );
    });
  } else {
    db.serialize(() => {
      db.each(
        `SELECT s.step_detail,s.step_Id FROM Steps s INNER JOIN Recipes r ON r.recipe_Id=s.recipe_Id WHERE r.recipe_Id=(?) AND r.category="Free";`,
        recipeId,
        (err, row) => {
          if (err) return res.json({ status: 300, success: false, error: err });
          data.push({ stepId: row.step_Id, text: row.step_detail });
        },
        () => {
          if (data.length < 1)
            return res.json({
              status: 401,
              success: false,
              error: "Unauthorized user, get a premium user token to continue",
            });
          return res.json({ status: 200, data: data, success: true });
        }
      );
    });
  }
});
// get a particular step of a particular recipe
app.get("/recipe/:recipe_Id/:step_Id", (req, res) => {
  let recipeId = req.params.recipe_Id;
  let stepId = req.params.step_Id;
  let data = [];
  if (req.cookies.usertype === "premium" || req.cookies.usertype === "admin") {
    db.serialize(() => {
      db.each(
        `SELECT s.step_detail,s.step_Id FROM Steps s INNER JOIN Recipes r ON r.recipe_Id=s.recipe_Id WHERE r.recipe_Id=? AND step_Id=?;`,
        recipeId,
        stepId,
        (err, row) => {
          if (err) return res.json({ status: 300, success: false, error: err });
          data.push({ stepId: row.step_Id, text: row.step_detail });
        },
        () => {
          res.send(data);
        }
      );
    });
  } else {
    db.serialize(() => {
      db.each(
        `SELECT s.step_detail,s.step_Id FROM Steps s INNER JOIN Recipes r ON r.recipe_Id=s.recipe_Id WHERE r.recipe_Id=? AND step_Id=? AND r.category="Free";`,
        recipeId,
        stepId,
        (err, row) => {
          if (err) return res.json({ status: 300, success: false, error: err });
          data.push({ stepId: row.step_Id, text: row.step_detail });
        },
        () => {
          if (data.length < 1)
            return res.json({
              status: 401,
              success: false,
              error: "Unauthorized user, get a premium user token to continue",
            });
          return res.json({ status: 200, data: data, success: true });
        }
      );
    });
  }
});

// PREMIUM TIER

// Get all recipes that have a given ingredient
app.get("/search/:ingredient", (req, res) => {
  let ingredientType = req.params.ingredient;
  let data = [];
  if (req.cookies.usertype === "premium" || req.cookies.usertype === "admin") {
    db.serialize(() => {
      db.each(
        "Select r.recipe_Name, r.recipe_Id, i.ingredient_Type from Recipes r inner JOIN RecipeIngredients t on r.recipe_Id= t.recipe_Id inner join Ingredients i on t.ingredient_Id = i.ingredient_Id WHERE i.ingredient_Type LIKE ?;",
        ingredientType,
        (err, row) => {
          if (err) return res.json({ status: 300, success: false, error: err });
          data.push({ recipeId: row.recipe_Id, recipeName: row.recipe_Name });
        },
        () => {
          res.send(data);
        }
      );
    });
  } else {
    return res.json({
      status: 403,
      message:
        "You are not authorized to access this, become a Premium user to get access",
      success: false,
    });
  }
});

// Get list af all the ingredients available in database
app.get("/ingredients", (req, res) => {
  let data = [];
  if (req.cookies.usertype === "premium" || req.cookies.usertype === "admin") {
    db.serialize(() => {
      db.each(
        "SELECT ingredient_Type FROM Ingredients ",
        (err, row) => {
          if (err) return res.json({ status: 300, success: false, error: err });
          data.push(row.ingredient_Type);
        },
        () => {
          res.send(data);
        }
      );
    });
  } else {
    return res.json({
      status: 403,
      message:
        "You are not authorized to access this, become a Premium user to get access",
      success: false,
    });
  }
});

// ADMINISTRATOR

// get Premium user authorization
app.get("/auth", (req, res) => {
  res.cookie("usertype", "admin");
  res.end();
});

// ADD A NEW RECIPE

app.post("/recipe", (req, res) => {
  if (req.cookies.usertype === "admin") {
    const { name, category, ingredients, steps } = req.body;
    let recipeName = name;
    let categoryName = category;
    let stepCount = steps.length;
    db.serialize(() => {
      db.each(
        `INSERT INTO  Recipes (recipe_Name, step_Count, category) VALUES (?,?, ?)`,
        recipeName,
        stepCount,
        categoryName
      ),
        db.each(
          "SELECT recipe_Id FROM Recipes WHERE recipe_Name = ? ",
          recipeName,
          (err, row) => {
            if (err) {
              res.status(404).json({ Error: "An error occured" });
            }
            let id = row.recipe_Id;
            for (let i = 0; i < steps.length; i++) {
              db.each(
                `INSERT INTO Steps ( step_Id,recipe_Id,step_detail) VALUES (?,?,?)`,
                steps[i].step_id,
                id,
                steps[i].text
              );
            }
            for (let j = 0; j < ingredients.length; j++) {
              db.each(
                `INSERT OR IGNORE INTO Ingredients (ingredient_Type) VALUES(?)`,
                ingredients[j].type
              ),
                db.each(
                  "SELECT ingredient_Id FROM Ingredients WHERE ingredient_Type = ?",
                  ingredients[j].type,
                  (err, row) => {
                    if (err) {
                      res.status(404).json({
                        Error: err.message,
                      });
                    }
                    let ingredientId = row.ingredient_Id;
                    console.log("Ingredient id inside loop ", ingredientId);
                    db.run(
                      `INSERT INTO RecipeIngredients (recipe_Id, ingredient_Id) VALUES (?, ?)`,
                      id,
                      ingredientId
                    );

                    db.run(
                      `INSERT INTO Measurements (measure,recipe_Id) VALUES (?, ?)`,
                      ingredients[j].entry,
                      id
                    ),
                      db.each(
                        "SELECT measure_Id FROM Measurements WHERE recipe_Id = ?",
                        id,
                        (err, row) => {
                          if (err) {
                            res.status(404).json({
                              Error: err.message,
                            });
                          }
                          let measureId = row.measure_Id;
                          db.run(
                            `UPDATE RecipeIngredients SET measure_Id =${measureId}  WHERE recipe_Id =(?) AND ingredient_Id = (?)`,
                            id,
                            ingredientId
                          );
                        }
                      );
                  }
                );
            }
          },
          () => {
            res.send("Recipe saved successfully");
          }
        );
    });
  } else {
    return res.json({
      status: 403,
      message:
        "You are not authorized to access this, become a Premium user to get access",
      success: false,
    });
  }
});

// Update Recipe
app.patch("/recipe/:recipe_Id", (req, res) => {});

// Replace Recipe
app.put("/recipe/:recipe_Id", (req, res) => {});

// Delete Recipe

app.delete("/recipe/:recipe_Id", (req, res) => {
  if (req.cookies.usertype === "admin") {
    db.serialize(() => {
      db.each(
        `DELETE from Recipes WHERE recipe_Id = ?`,
        req.params.recipe_Id,
        (err, res) => {
          if (err) return res.json({ status: 300, success: false, error: err });
          deletedRecord = res;
        }
      );
      db.each(
        `DELETE from Steps WHERE recipe_Id = ?`,
        req.params.recipe_Id,
        (err, res) => {
          if (err) return res.json({ status: 300, success: false, error: err });
          deletedRecord = res;
        }
      );
      db.each(
        `DELETE from RecipeIngredients WHERE recipe_Id = ?`,
        req.params.recipe_Id,
        (err, res) => {
          if (err) return res.json({ status: 300, success: false, error: err });
          deletedRecord = res;
        }
      );
      db.each(
        `DELETE from Measurements WHERE recipe_Id = ?`,
        req.params.recipe_Id,
        (err, res) => {
          if (err) return res.json({ status: 300, success: false, error: err });
          deletedRecord = res;
        },
        () => {
          res.send("record deleted");
        }
      );
    });
  } else {
    return res.json({
      status: 403,
      message:
        "You are not authorized to access this, become a Premium user to get access",
      success: false,
    });
  }
});

// Server listening
app.listen(port, () => {
  console.log(`server is running at http://${hostname}:${port}`);
});
