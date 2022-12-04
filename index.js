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

// working
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

// Server listening
app.listen(port, () => {
  console.log(`server is running at http://${hostname}:${port}`);
});
