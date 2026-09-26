import React from 'react'
import WorkoutRow from './WorkoutRow.jsx'

const WorkoutTable = function( props ) {
  if( props.workouts.length === 0 ) {
    return (
      <div className="card shadow-sm">
        <div className="card-body">
          <h2 className="h4 mb-3">Workout Log</h2>

          <div className="alert alert-secondary">
            No workouts have been logged yet.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h2 className="h4 mb-3">Workout Log</h2>

        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead>
              <tr>
                <th scope="col">Exercise</th>
                <th scope="col">Type</th>
                <th scope="col">Sets</th>
                <th scope="col">Reps</th>
                <th scope="col">Weight</th>
                <th scope="col">Volume</th>
                <th scope="col">Notes</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>

            <tbody>
              { props.workouts.map( function( workout ) {
                return (
                  <WorkoutRow
                    key={ workout.id }
                    workout={ workout }
                    setEditingWorkout={ props.setEditingWorkout }
                    deleteWorkout={ props.deleteWorkout }
                  />
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default WorkoutTable