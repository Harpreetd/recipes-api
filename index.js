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
  // console.log(req.cookies.usertype);
  let data = [];
  if (req.cookies.usertype === "premium") {
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
          res.send(data);
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
});

// get detailed steps of a given recipe
app.get("/recipe/:recipe_Id/all", (req, res) => {
  let recipeId = req.params.recipe_Id;
  let data = [];
  db.serialize(() => {
    db.each(
      `SELECT s.step_detail,s.step_Id FROM Steps s INNER JOIN Recipes r ON r.recipe_Id=s.recipe_Id WHERE r.recipe_Id=${recipeId};`,
      (err, row) => {
        if (err) return res.json({ status: 300, success: false, error: err });
        data.push({ stepId: row.step_Id, text: row.step_detail });
      },
      () => {
        res.send(data);
      }
    );
  });
});
// get a particular step of a particular recipe
app.get("/recipe/:recipe_Id/:step_Id", (req, res) => {
  let recipeId = req.params.recipe_Id;
  let stepId = req.params.step_Id;
  let data = [];
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
});

// PREMIUM TIER

// Get all recipes that have a given ingredient
app.get("/search/:ingredient", (req, res) => {
  let ingredientType = req.params.ingredient;
  // console.log(req.cookies.usertype);
  let data = [];
  if (req.cookies.usertype === "premium") {
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
      status: 401,
      message:
        "You are not authorized to access this, become a Premium user to get access",
      success: false,
    });
  }
});

// Get list af all the ingredients available in database
app.get("/ingredients", (req, res) => {
  // console.log(req.body);
  let data = [];
  if (req.cookies.usertype === "premium") {
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
      status: 401,
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
  let data;
  // if (req.cookies.usertype === "admin") {
  const { name, category, ingredients, stepCount, steps } = req.body;

  data = {
    name: name,
    category: category,
    ingredients: ingredients,
    stepCount: stepCount,
    steps: steps,
  };
  let recipeName = name;
  let categoryName = category;
  let IngredientType = ingredients[0].type;
  let MeasureDetail = ingredients[0].entry;
  let stepNumber = steps[0].step_id;
  let stepText = steps[0].text;
  let id;
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
          console.log(row);
          id = row.recipe_Id;

          db.run(
            `INSERT INTO Steps ( step_Id,recipe_Id,step_detail) VALUES (?,?,?)`,
            stepNumber,
            id,
            stepText
          ),
            db.run(
              `INSERT OR IGNORE INTO Ingredients (ingredient_Type) VALUES(?)`,
              IngredientType
            ),
            db.run(
              `INSERT INTO Measurements (measure,recipe_Id) VALUES (?, ?)`,
              MeasureDetail,
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
                measureId = row.measure_Id;

                db.run(
                  `INSERT INTO RecipeIngredients (recipe_Id, measure_Id) VALUES (?, ?)`,
                  id,
                  measureId
                );
              }
            );
        },
        // (err, res) => {
        //   console.log("id inside last callback", id);
        //   if (err) return res.json({ status: 300, success: false, error: err });
        //   data = res;
        // },
        () => {
          res.send(data);
        }
      );
  });
  // }

  // res.send("recipe saved"););
});

// Update Recipe
app.patch("/recipe/:recipe_Id", (req, res) => {});

// Replace Recipe
app.put("/recipe/:recipe_Id", (req, res) => {});

// Delete Recipe

app.delete("/recipe/:recipe_Id", (req, res) => {
  console.log(req.params.recipe_Id);
  let deletedRecord;
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
});

// Server listening
app.listen(port, () => {
  console.log(`server is running at http://${hostname}:${port}`);
});

// .each(`SELECT MAX(recipe_Id) AS id FROM Recipes`)
// .run(
//   `INSERT INTO Ingredients (ingredient_Type) VALUES(?)`,
//   ingredients.type
// )
// .run(
//   `INSERT INTO Measurements (measure,recipe_Id) VALUES (?, ?)`,
//   ingredients.entry,
//   id
// );
// db.run(`SELECT * from Recipes`);

// let id = db.lastInsertId();
// let id = db.run(`SELECT last_insert_rowid();`);
// SELECT MAX(rowid) FROM your_table_name
// console.log("id", id);
// db.run(`SELECT MAX(recipe_Id) As id FROM Recipes`);
// db.run(
//   `INSERT INTO Ingredients (ingredient_Type) VALUES(?)`,
//   ingredients.type
// );
// db.run(
//   `INSERT INTO Measurements (measure,recipe_Id) VALUES (?, ?)`,
//   ingredients.entry,
//   id
// );
// db.run(
//   `INSERT INTO Steps (step_Id, step_detail,recipe_Id) VALUES (?,?,?)`,
//   steps.step_id,
//   steps.text,
//   id
// );
