const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'moviesData.db')

let db = null
const InitializeDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (err) {
    console.log(`Error DB: ${err.message}`)
    process.exit(1)
  }
}

InitializeDB()

function convertDbObjectToResponseObject(dbObject) {
  return {
    movieName: dbObject.movie_name,
  }
}

// Returns a list of all movie names in the movie table

app.get('/movies/', async (request, response) => {
  const getListOfAllMoviesQuery = `
  SELECT 
  movie_name
  FROM 
  movie
  ; `
  const movieNameList = await db.all(getListOfAllMoviesQuery)
  response.send(
    movieNameList.map(eachItem => convertDbObjectToResponseObject(eachItem)),
  )
})

//Creates a new movie in the movie table. `movie_id` is auto-incremented

app.post('/movies/', async (request, response) => {
  const {directorId, movieName, leadActor} = request.body

  const addNewMovieQuery = `
  INSERT INTO 
  movie(director_id, movie_name, lead_actor)
  VALUES 
  ( ${directorId},
    "${movieName}",
    "${leadActor}"
    );`
  await db.run(addNewMovieQuery)
  response.send('Movie Successfully Added')
})

//Returns a movie based on the movie ID

function convertToResponseObject(dbObject) {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}

app.get('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const getSingleMovieQuery = `
  SELECT 
  *
  FROM 
  movie
  WHERE movie_id = ${movieId}
  ;`
  const movieList = await db.all(getSingleMovieQuery)
  response.send(movieList.map(eachItem => convertToResponseObject(eachItem))[0])
})

// Updates the details of a movie in the movie table based on the movie ID

app.put('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const {directorId, movieName, leadActor} = request.body
  const updateMovieQuery = `
  UPDATE movie
  SET director_id = ${directorId},
  movie_name = "${movieName}",
  lead_actor = "${leadActor}"
  WHERE movie_id = ${movieId}
  ;`

  await db.run(updateMovieQuery)
  response.send('Movie Details Updated')
})

//Deletes a movie from the movie table based on the movie ID

app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteMovieQuery = `
  DELETE FROM
  movie
  WHERE movie_id = ${movieId}
  ;`
  await db.run(deleteMovieQuery)
  response.send('Movie Removed')
})

//Returns a list of all directors in the director table
function convertDirectorsToResponseOb(dbObject) {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  }
}

app.get('/directors/', async (request, response) => {
  const getAllDirectorsQuery = `
  SELECT 
  * 
  FROM 
  director;`
  const directorsList = await db.all(getAllDirectorsQuery)
  response.send(
    directorsList.map(eachItem => convertDirectorsToResponseOb(eachItem)),
  )
})

//Returns a list of all movie names directed by a specific director

app.get('/directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const getSpecificDirectorMovies = `
  SELECT movie_name
  FROM movie
  WHERE director_id = ${directorId};`

  const moviesArray = await db.all(getSpecificDirectorMovies)
  response.send(
    moviesArray.map(eachItem => convertDbObjectToResponseObject(eachItem)),
  )
})

module.exports = app
