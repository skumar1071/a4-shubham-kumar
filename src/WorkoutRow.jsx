import React from 'react'

const WorkoutRow = function( props ) {
  const workout = props.workout

  return (
    <tr>
      <td>{ workout.exercise }</td>
      <td>{ workout.category || 'Other' }</td>
      <td>{ workout.sets }</td>
      <td>{ workout.reps }</td>

      <td>
        { workout.weight } { workout.unit || 'lb' }
      </td>

      <td>
        { workout.volume } { workout.unit || 'lb' }
      </td>

      <td>{ workout.notes || '' }</td>

      <td>
        <button
          type="button"
          className="btn btn-warning btn-sm me-2"
          onClick={ function() {
            props.setEditingWorkout( workout )

            window.scrollTo({
              top: 0,
              behavior: 'smooth'
            })
          }}
        >
          Edit
        </button>

        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={ function() {
            props.deleteWorkout( workout.id )
          }}
        >
          Delete
        </button>
      </td>
    </tr>
  )
}

export default WorkoutRow