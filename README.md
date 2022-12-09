
## Project Title

Exam Project: Recipe Collection


## Description

The assignment was to create a Database with a collection of recipes and provide different API end-points for different type of users.
The database mainly has three parts: publicly accessible free-teir, a secondary secure premium-tier for users with an authentication cookie and third Admin tier where the admin gets a different authentication cookie to get access to store, update and delete the recipes from the database.


## Programs

* Visual Studio Code
* Postman
* DB browser for SQLite


 




## Run Locally


Extract the zipped folder to a new project directory

Go to the project directory

```bash
  cd my-project
```

Install dependencies by using one of the following

```bash
  npm install
```

or

```bash
 npm install express
  npm install sqlite3
  npm install body-parser
  npm install cookie-parser
  npm install express-session
  
```

Start the server

```bash
  npm run start
```

application will be running at http://localhost:8080 or any other available port in case port 8080 is not available
## New Database 

In case you would want to create a new database change the start script in package.json to
"start": "node createTable.js" and start the server by using :

```bash
 npm run start
```

after you have successfully created a new database you can change the start script back to
"start": "node index.js" and start the server again by using:

```bash
 npm run start
```
## API Reference


### GET ALL AVAILABLE RCIPES

```http
  GET /recipes
```
### GET OVERVIEW OF STEPS OF ONE RECIPE

```http
  GET /recipe/:recipe_Id
```

### GET DETAILED STEPS OF A RECIPE

```http
  GET /recipe/:recipe_Id/all
```
### GET A PARTICULAR STEP OF A RECIPE

```http
  GET /recipe/:recipe_Id/:step_Id
```

## PREMIUM-TIER

### GET AN AUTHENTICATION COOKIE TO BECOME A PREMIUM USER

```http
  GET /
```
### GET ALL THE RECIPES THAT CONTAIN A SPECIFIC INGREDIENT

```http
  GET /search/:ingredient
```
###  GET LIST OF ALL THE AVAILABLE INGREDIENTS

```http
  GET /ingredients
```
## ADMIN-TIER

### GET ADMIN AUTHORIZATION BY A NEW COOKIE

```http
  GET /auth
```
### ADD A NEW RECIPE TO THE DATABASE
```http
  POST /recipe
```

### UPDATE THE CATEGORY OF A RECIPE

```http
  PATCH /recipe/:recipe_Id
```

### REPLACE A RECIPE 
```http
  PUT /recipe/:recipe_Id
```

### DELETE A RECIPE

```http
 DELETE /recipe/:recipe_Id
```


## License

[MIT](https://choosealicense.com/licenses/mit/)
