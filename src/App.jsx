import React, { useEffect, useState } from 'react'
import WorkoutForm from './WorkoutForm.jsx'
import WorkoutTable from './WorkoutTable.jsx'

const App = function() {
  const [ workouts, setWorkouts ] = useState([]),
        [ editingWorkout, setEditingWorkout ] = useState( null )

  useEffect( function() {
    const loadWorkouts = async function() {
      const response = await fetch( '/data' )

      if( response.status === 401 ) {
        window.location.href = '/'
        return
      }

      const data = await response.json()
      setWorkouts( data )
    }

    loadWorkouts()
  }, [] )

  const deleteWorkout = async function( id ) {
    const response = await fetch( '/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: id })
    })

    if( response.status === 401 ) {
      window.location.href = '/'
      return
    }

    const data = await response.json()
    setWorkouts( data )

    if( editingWorkout !== null &&
        editingWorkout.id === id ) {
      setEditingWorkout( null )
    }
  }

  return (
    <>
      <header className="bg-dark text-white py-4">
        <div className="container d-flex justify-content-between align-items-center gap-3">
          <div>
            <h1 className="mb-1">Workout Tracker</h1>
            <p className="mb-0">
              Log your exercises and track your training volume.
            </p>
          </div>

          <a href="/logout" className="btn btn-outline-light">
            Log Out
          </a>
        </div>
      </header>

      <main className="container py-4">
        <div className="row g-4">

          <section className="col-lg-4">
            <WorkoutForm
              setWorkouts={ setWorkouts }
              editingWorkout={ editingWorkout }
              setEditingWorkout={ setEditingWorkout }
            />
          </section>

          <section className="col-lg-8">
            <WorkoutTable
              workouts={ workouts }
              setEditingWorkout={ setEditingWorkout }
              deleteWorkout={ deleteWorkout }
            />
          </section>

        </div>
      </main>
    </>
  )
}

export default App