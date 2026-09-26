require( 'dotenv' ).config()

const express = require( 'express' ),
      ViteExpress = require( 'vite-express' ),
      cookie = require( 'cookie-session' ),
      bcrypt = require( 'bcryptjs' ),
      crypto = require( 'crypto' ),
      { MongoClient, ObjectId } = require( 'mongodb' ),
      path = require( 'path' ),
      app = express(),
      port = process.env.PORT || 3000,
      isProduction = process.env.NODE_ENV === 'production'

app.use( express.static( 'public' ) )

if( isProduction ) {
  app.use( express.static( path.join( __dirname, 'dist' ) ) )
}

app.use( express.json() )
app.use( express.urlencoded({ extended: true }) )

app.use( cookie({
  name: 'session',
  keys: [ process.env.SESSION_KEY ]
}))


// MongoDB setup
const mongoUsername = encodeURIComponent( process.env.MONGO_USER ),
      mongoPassword = encodeURIComponent( process.env.MONGO_PASS ),
      mongoHost = process.env.MONGO_HOST,
      uri = `mongodb+srv://${ mongoUsername }:${ mongoPassword }@${ mongoHost }`,
      client = new MongoClient( uri )

let workoutsCollection = null,
    usersCollection = null


// Calculate the total volume of a workout
const calculateVolume = function( sets, reps, weight ) {
  return sets * reps * weight
}


// Format MongoDB workout documents for the client
const formatWorkouts = function( workouts ) {
  return workouts.map( function( workout ) {
    return {
      id: workout._id.toString(),
      exercise: workout.exercise,
      category: workout.category,
      sets: workout.sets,
      reps: workout.reps,
      weight: workout.weight,
      unit: workout.unit,
      notes: workout.notes,
      volume: workout.volume
    }
  })
}


// Check whether a user is logged in
const requireLogin = function( req, res, next ) {
  if( req.session.username !== undefined ||
      req.session.githubId !== undefined ) {
    next()
  } else {
    res.status( 401 ).json({ error: 'Not authenticated' })
  }
}


// Build a query for the current user's workouts
const getWorkoutQuery = function( req ) {
  if( req.session.githubId !== undefined ) {
    return { githubId: req.session.githubId }
  } else {
    return { username: req.session.username }
  }
}


// Begin GitHub OAuth login
app.get( '/auth/github', function( req, res ) {
  const state = crypto.randomBytes( 16 ).toString( 'hex' )

  req.session.oauthState = state

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    state: state
  })

  res.redirect(
    `https://github.com/login/oauth/authorize?${ params.toString() }`
  )
})


// Handle GitHub OAuth callback
app.get( '/auth/github/callback', async function( req, res ) {
  try {
    const code = req.query.code,
          returnedState = req.query.state

    if( code === undefined || returnedState === undefined ) {
      res.status( 400 ).send(
        'GitHub did not return the required OAuth information.'
      )
      return
    }

    if( returnedState !== req.session.oauthState ) {
      res.status( 403 ).send( 'Invalid OAuth state.' )
      return
    }

    delete req.session.oauthState

    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: code,
          redirect_uri: process.env.GITHUB_CALLBACK_URL
        })
      }
    )

    const tokenData = await tokenResponse.json()

    if( tokenData.access_token === undefined ) {
      console.error( 'GitHub token error:', tokenData )
      res.status( 500 ).send( 'Unable to authenticate with GitHub.' )
      return
    }

    const githubResponse = await fetch(
      'https://api.github.com/user',
      {
        headers: {
          'Authorization': `Bearer ${ tokenData.access_token }`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'CS4241-Workout-Tracker'
        }
      }
    )

    if( githubResponse.ok === false ) {
      const errorText = await githubResponse.text()

      console.error( 'GitHub user request failed:', errorText )
      res.status( 500 ).send( 'Unable to retrieve GitHub user.' )
      return
    }

    const githubUser = await githubResponse.json(),
          githubId = String( githubUser.id ),
          githubUsername = githubUser.login,
          user = await usersCollection.findOne({
            githubId: githubId
          })

    if( user === null ) {
      await usersCollection.insertOne({
        githubId: githubId,
        githubUsername: githubUsername,
        authType: 'github'
      })
    } else {
      await usersCollection.updateOne(
        { githubId: githubId },
        { $set: { githubUsername: githubUsername } }
      )
    }

    delete req.session.username

    req.session.githubId = githubId
    req.session.githubUsername = githubUsername

    res.redirect( '/app' )

  } catch( error ) {
    console.error( 'GitHub OAuth error:', error )
    res.status( 500 ).send( 'GitHub authentication failed.' )
  }
})


// Username/password login
app.post( '/login', async function( req, res ) {
  const loginUsername = req.body.username.trim(),
        loginPassword = req.body.password,
        user = await usersCollection.findOne({
          username: loginUsername
        })

  if( user === null ) {
    const passwordHash = await bcrypt.hash( loginPassword, 10 )

    await usersCollection.insertOne({
      username: loginUsername,
      password: passwordHash,
      authType: 'password'
    })

    delete req.session.githubId
    delete req.session.githubUsername

    req.session.username = loginUsername
    res.redirect( '/app' )

  } else {
    const passwordCorrect = await bcrypt.compare(
      loginPassword,
      user.password
    )

    if( passwordCorrect ) {
      delete req.session.githubId
      delete req.session.githubUsername

      req.session.username = loginUsername
      res.redirect( '/app' )
    } else {
      res.redirect( '/?loginFailed=true' )
    }
  }
})


app.get( '/app', function( req, res ) {
  if( req.session.username === undefined &&
      req.session.githubId === undefined ) {
    res.redirect( '/' )
    return
  }

  if( isProduction ) {
    res.sendFile(
      path.join( __dirname, 'dist', 'views', 'app.html' )
    )
  } else {
    res.sendFile(
      path.join( __dirname, 'views', 'app.html' )
    )
  }
})


// Log out
app.get( '/logout', function( req, res ) {
  req.session = null
  res.redirect( '/' )
})


// Get current user's workouts
app.get( '/data', requireLogin, async function( req, res ) {
  const workouts = await workoutsCollection
    .find( getWorkoutQuery( req ) )
    .toArray()

  res.json( formatWorkouts( workouts ) )
})


// Add workout
app.post( '/submit', requireLogin, async function( req, res ) {
  const workout = {
    exercise: req.body.exercise,
    category: req.body.category,
    sets: Number( req.body.sets ),
    reps: Number( req.body.reps ),
    weight: Number( req.body.weight ),
    unit: req.body.unit,
    notes: req.body.notes
  }

  if( req.session.githubId !== undefined ) {
    workout.githubId = req.session.githubId
  } else {
    workout.username = req.session.username
  }

  workout.volume = calculateVolume(
    workout.sets,
    workout.reps,
    workout.weight
  )

  await workoutsCollection.insertOne( workout )

  const workouts = await workoutsCollection
    .find( getWorkoutQuery( req ) )
    .toArray()

  res.json( formatWorkouts( workouts ) )
})


// Delete workout
app.post( '/delete', requireLogin, async function( req, res ) {
  const ownershipQuery = {
    _id: new ObjectId( req.body.id )
  }

  if( req.session.githubId !== undefined ) {
    ownershipQuery.githubId = req.session.githubId
  } else {
    ownershipQuery.username = req.session.username
  }

  await workoutsCollection.deleteOne( ownershipQuery )

  const workouts = await workoutsCollection
    .find( getWorkoutQuery( req ) )
    .toArray()

  res.json( formatWorkouts( workouts ) )
})


// Update workout
app.post( '/update', requireLogin, async function( req, res ) {
  const sets = Number( req.body.sets ),
        reps = Number( req.body.reps ),
        weight = Number( req.body.weight ),
        volume = calculateVolume( sets, reps, weight ),
        ownershipQuery = {
          _id: new ObjectId( req.body.id )
        }

  if( req.session.githubId !== undefined ) {
    ownershipQuery.githubId = req.session.githubId
  } else {
    ownershipQuery.username = req.session.username
  }

  await workoutsCollection.updateOne(
    ownershipQuery,
    {
      $set: {
        exercise: req.body.exercise,
        category: req.body.category,
        sets: sets,
        reps: reps,
        weight: weight,
        unit: req.body.unit,
        notes: req.body.notes,
        volume: volume
      }
    }
  )

  const workouts = await workoutsCollection
    .find( getWorkoutQuery( req ) )
    .toArray()

  res.json( formatWorkouts( workouts ) )
})


// Connect to MongoDB and start server
async function run() {
  try {
    await client.connect()

    const db = client.db( 'workoutTracker' )

    workoutsCollection = db.collection( 'workouts' )
    usersCollection = db.collection( 'users' )

    console.log( 'Connected to MongoDB' )

    ViteExpress.listen( app, port, function() {
      console.log( `Server running on port ${ port }` )
    })

  } catch( error ) {
    console.error( 'MongoDB connection failed:', error )
  }
}

run()