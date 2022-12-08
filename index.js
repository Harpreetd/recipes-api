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
// Cookie Configuration
app.use(
  sessions({
    secret: "food monster",
    saveUninitialized: true,
    cookie: { maxAge: 6000 },
    resave: false,
    secure: false,
  })
);

// CONNECTING TO THE DATABSE
const sqlite = require("sqlite3").verbose();
const db = new sqlite.Database(__dirname + "./recipeCollection.db", (err) => {
  if (err) return console.error(err);
  console.log("connection created");
});

// GET Recipes // Returns all Available recipes if user has premium/admin authorization and returns only free recipe for  normal user
app.get("/recipes", (req, res) => {
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
// GET A PARTICULAR RECIPE WITH A PARAMETER OF recipe_Id (IINTEGER/NUMBER)
app.get("/recipe/:recipe_Id", (req, res) => {
  let recipeId = req.params.recipe_Id;
  let data;
  let recipeName;
  let stepsCount;
  let ingredients = [];
  if (req.cookies.usertype === "premium" || req.cookies.usertype === "admin") {
    db.serialize(() => {
      db.each(
        `SELECT r.recipe_Name,r.step_Count, m.measure , i.ingredient_Type
from Recipes r inner JOIN  Measurements m on m.recipe_Id=r.recipe_Id inner JOIN Ingredients i on i.ingredient_Id=m.ingredient_Id WHERE r.recipe_Id= ? ;`,
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
              status: 404,
              success: false,
              error: "No recipes Found, try a different recipe",
            });
          return res.json({ status: 200, data: data, success: true });
        }
      );
    });
  } else {
    db.serialize(() => {
      db.each(
        `SELECT r.recipe_Name,r.step_Count, m.measure , i.ingredient_Type
from Recipes r inner JOIN  Measurements m on m.recipe_Id=r.recipe_Id inner JOIN Ingredients i on i.ingredient_Id=m.ingredient_Id WHERE r.recipe_Id= ? AND r.category='Free';`,
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

// GET DETAILED STEPS OF A RECIPE WITH A PARAMETER OF recipeId/all
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
          if (data.length < 1)
            return res.json({
              status: 404,
              success: false,
              error: "No result found, try a different recipe",
            });
          return res.json({ status: 200, data: data, success: true });
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
// GET A PARTICULAR STEP OF A RECIPE WITH PARAMETERS recipe_Id AND step_Id (both INTEGER/NUMBER)
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
          if (data.length < 1)
            return res.json({
              status: 404,
              success: false,
              error: "No results found, try a different recipe.",
            });
          return res.json({ status: 200, data: data, success: true });
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
// GET PREMIUM USER AUTHENTICATION
app.get("/", (req, res) => {
  res.cookie("usertype", "premium");
  res.send("Congratulation! You have got Premium user authorization");
});
// GET ALL THE RECIPES THAT CONTAIN A SPECIFIC INGREDIENT WITH PARAMETER ingredient (STRING)
app.get("/search/:ingredient", (req, res) => {
  let ingredientType = req.params.ingredient;
  let data = [];
  if (req.cookies.usertype === "premium" || req.cookies.usertype === "admin") {
    db.serialize(() => {
      db.each(
        "Select r.recipe_Name, r.recipe_Id, i.ingredient_Type from Recipes r inner JOIN Measurements m on m.recipe_Id=r.recipe_Id inner JOIN Ingredients i on i.ingredient_Id=m.ingredient_Id WHERE i.ingredient_Type LIKE",
        ingredientType,
        (err, row) => {
          if (err) return res.json({ status: 300, success: false, error: err });
          data.push({ recipeId: row.recipe_Id, recipeName: row.recipe_Name });
        },
        () => {
          if (data.length < 1)
            return res.json({
              status: 404,
              success: false,
              error: "No Recipe found, try a different ingredient",
            });
          return res.json({ status: 200, data: data, success: true });
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

// GET LIST OF ALL THE AVAILABLE INGREDIENTS
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
          if (data.length < 1)
            return res.json({
              status: 404,
              success: false,
              error: "No ingredients Found,",
            });
          return res.json({ status: 200, data: data, success: true });
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

// GET ADMIN AUTHORIZATION
app.get("/auth", (req, res) => {
  res.cookie("usertype", "admin");
  res.send("You have got the admin authentication token");
});

// ADD A NEW RECIPE TO THE DATABASE
app.post("/recipe", (req, res) => {
  if (req.cookies.usertype === "admin") {
    const { name, category, ingredients, steps } = req.body;
    let recipeName = name;
    let categoryName = category;
    let stepCount = steps.length;
    db.serialize(() => {
      db.each(
        `INSERT OR IGNORE INTO  Recipes (recipe_Name, step_Count, category) VALUES (?,?, ?)`,
        recipeName,
        stepCount,
        categoryName
      ),
        db.each(
          "SELECT recipe_Id FROM Recipes WHERE recipe_Name = ? ",
          recipeName,
          (err, row) => {
            if (err)
              return res.json({ status: 300, success: false, error: err });
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
                    if (err)
                      return res.json({
                        status: 300,
                        success: false,
                        error: err,
                      });
                    let ingredientId = row.ingredient_Id;
                    db.run(
                      `INSERT INTO Measurements (measure,recipe_Id,ingredient_Id) VALUES (?,?, ?)`,
                      ingredients[j].entry,
                      id,
                      ingredientId
                    );
                  }
                );
            }
          },
          (err, result) => {
            if (err)
              return res.json({ status: 300, success: false, error: err });
            return res.json({
              status: 200,
              message: "Recipe saved successfully",
              success: true,
            });
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

//UPDATE THE CATEGORY OF A RECIPE WITH THE PARAMETER RECIPEID (INTEGER/NUMBER)
app.patch("/recipe/:recipe_Id", (req, res) => {
  let newCategory = req.body.category;
  console.log(newCategory);
  if (req.cookies.usertype === "admin") {
    db.serialize(() => {
      db.each(
        `UPDATE Recipes SET category= "${newCategory}" Where recipe_Id=?`,
        req.params.recipe_Id,
        (err, row) => {
          if (err) return res.json({ status: 300, success: false, error: err });
          return res.json({
            status: 200,
            message: "Category Updated successfully",
            success: true,
          });
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

// REPLACE A SPECIFIC RECIPE WITH PARAMETER RECIPEID (INTEGER/NUMBER)
app.put("/recipe/:recipe_Id", (req, res) => {
  const recipeId = req.params.recipe_Id;
  console.log(recipeId);
  if (req.cookies.usertype === "admin") {
    const { name, category, ingredients, steps } = req.body;
    let recipeName = name;
    let categoryName = category;
    let stepCount = steps.length;
    db.serialize(() => {
      db.each(
        `UPDATE Recipes SET recipe_Name="${recipeName}", step_Count=${stepCount}, category="${categoryName}" WHERE recipe_Id=${recipeId}`
      ),
        db.each(
          "SELECT recipe_Id FROM Recipes WHERE recipe_Name = ? ",
          recipeName,
          (err, row) => {
            if (err)
              return res.json({ status: 300, success: false, error: err });
            for (let i = 0; i < steps.length; i++) {
              db.each(
                `UPDATE Steps SET  step_detail="${steps[i].text}" WHERE recipe_Id=${recipeId} AND step_Id=${steps[i].step_id}`,
                (err, row) => {
                  if (err)
                    return res.json({
                      status: 300,
                      success: false,
                      error: err,
                    });
                }
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
                    if (err)
                      return res.json({
                        status: 300,
                        success: false,
                        error: err,
                      });
                    let ingredientId = row.ingredient_Id;

                    db.run(
                      `UPDATE Measurements SET measure ="${ingredients[j].entry}" WHERE recipe_Id=${recipeId} AND ingredient_Id=${ingredientId}`
                    );
                  }
                );
            }
          },
          (err, result) => {
            if (err)
              return res.json({
                status: 300,
                success: false,
                error: err,
              });
            return res.json({
              status: 200,
              message: "Recipe updated successfully",
              success: true,
            });
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

// DELETE A RECIPE WITH PARAMETER RECIPEID (INTEGER/NUMBER)
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
        `DELETE from Measurements WHERE recipe_Id = ?`,
        req.params.recipe_Id,
        (err, res) => {
          if (err) return res.json({ status: 300, success: false, error: err });
          deletedRecord = res;
        },
        (err, result) => {
          if (err) return res.json({ status: 300, success: false, error: err });
          return res.json({
            status: 200,
            message: "Recipe deleted successfully",
            success: true,
          });
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

// SERVER LISTENIING
app.listen(port, () => {
  console.log(`server is running at http://${hostname}:${port}`);
});
