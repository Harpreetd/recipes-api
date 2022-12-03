const express = require("express"); // importing express from express module for request processing
const bodyParser = require("body-parser"); // importing body-parser
const hostname = "localhost"; // name of the server
const port = process.env.PORT || 8080; // port of the server
const app = express(); // creating an express app instance
app.use(bodyParser.json()); //using body-parser to parse the request body

const sqlite = require("sqlite3").verbose();
const db = new sqlite.Database(__dirname + "./recipe.db", (err) => {
  if (err) return console.error(err);
});

// Server listening
app.listen(port, () => {
  console.log(`server is running at http://${hostname}:${port}`);
});
