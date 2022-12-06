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
    resave: true,
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
// just for testing ---working
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
  console.log(req.cookies.usertype);
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

// Get all recipes that have a given ingredient
app.get("/search/:ingredient", (req, res) => {
  let ingredientType = req.params.ingredient;
  let data = [];
  db.serialize(() => {
    db.each(
      "Select r.recipe_Name, r.recipe_Id, i.ingredient_Type from Recipes r inner JOIN RecipeIngredients t on r.recipe_Id= t.recipe_Id inner join Ingredients i on t.ingredient_Id = i.ingredient_Id WHERE i.ingredient_Type LIKE ?;",
      `${ingredientType}`,
      (err, row) => {
        if (err) return res.json({ status: 300, success: false, error: err });
        data.push({ recipeId: row.recipe_Id, recipeName: row.recipe_Name });
      },
      () => {
        res.send(data);
      }
    );
  });
});

// Get list af all the ingredients available in database
app.get("/ingredients", (req, res) => {
  console.log(req.body);
  let data = [];
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
});

// Server listening
app.listen(port, () => {
  console.log(`server is running at http://${hostname}:${port}`);
});
