import React, { useEffect, useState } from 'react'

const WorkoutForm = function( props ) {
  const [ exercise, setExercise ] = useState( '' ),
        [ category, setCategory ] = useState( 'Chest' ),
        [ sets, setSets ] = useState( '' ),
        [ reps, setReps ] = useState( '' ),
        [ weight, setWeight ] = useState( '' ),
        [ unit, setUnit ] = useState( 'lb' ),
        [ notes, setNotes ] = useState( '' )

  useEffect( function() {
    if( props.editingWorkout !== null ) {
      setExercise( props.editingWorkout.exercise )
      setCategory( props.editingWorkout.category )
      setSets( props.editingWorkout.sets )
      setReps( props.editingWorkout.reps )
      setWeight( props.editingWorkout.weight )
      setUnit( props.editingWorkout.unit )
      setNotes( props.editingWorkout.notes || '' )
    }
  }, [ props.editingWorkout ] )

  const clearForm = function() {
    setExercise( '' )
    setCategory( 'Chest' )
    setSets( '' )
    setReps( '' )
    setWeight( '' )
    setUnit( 'lb' )
    setNotes( '' )
    props.setEditingWorkout( null )
  }

  const submitWorkout = async function( event ) {
    event.preventDefault()

    const workout = {
      exercise: exercise,
      category: category,
      sets: sets,
      reps: reps,
      weight: weight,
      unit: unit,
      notes: notes
    }

    let url = '/submit'

    if( props.editingWorkout !== null ) {
      url = '/update'
      workout.id = props.editingWorkout.id
    }

    const response = await fetch( url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify( workout )
    })

    if( response.status === 401 ) {
      window.location.href = '/'
      return
    }

    const workouts = await response.json()

    props.setWorkouts( workouts )
    clearForm()
  }

  return (
    <div className="card shadow-sm h-100">
      <div className="card-body">
        <h2 className="h4 mb-3">
          { props.editingWorkout === null
            ? 'Log an Exercise'
            : 'Edit Exercise' }
        </h2>

        <form onSubmit={ submitWorkout }>
          <div className="mb-3">
            <label htmlFor="exercise" className="form-label">
              Exercise
            </label>

            <input
              type="text"
              id="exercise"
              className="form-control"
              placeholder="Bench Press"
              value={ exercise }
              onChange={ event => setExercise( event.target.value ) }
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="category" className="form-label">
              Exercise Type
            </label>

            <select
              id="category"
              className="form-select"
              value={ category }
              onChange={ event => setCategory( event.target.value ) }
              required
            >
              <option value="Chest">Chest</option>
              <option value="Back">Back</option>
              <option value="Legs">Legs</option>
              <option value="Shoulders">Shoulders</option>
              <option value="Arms">Arms</option>
              <option value="Core">Core</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="sets" className="form-label">
                Sets
              </label>

              <input
                type="number"
                id="sets"
                className="form-control"
                min="1"
                value={ sets }
                onChange={ event => setSets( event.target.value ) }
                required
              />
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="reps" className="form-label">
                Reps
              </label>

              <input
                type="number"
                id="reps"
                className="form-control"
                min="1"
                value={ reps }
                onChange={ event => setReps( event.target.value ) }
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="weight" className="form-label">
              Weight
            </label>

            <input
              type="number"
              id="weight"
              className="form-control"
              min="0"
              step="0.5"
              value={ weight }
              onChange={ event => setWeight( event.target.value ) }
              required
            />
          </div>

          <fieldset className="mb-3">
            <legend className="form-label fs-6">
              Weight Unit
            </legend>

            <div className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                name="unit"
                id="unit-lb"
                value="lb"
                checked={ unit === 'lb' }
                onChange={ event => setUnit( event.target.value ) }
              />

              <label className="form-check-label" htmlFor="unit-lb">
                Pounds
              </label>
            </div>

            <div className="form-check form-check-inline">
              <input
                className="form-check-input"
                type="radio"
                name="unit"
                id="unit-kg"
                value="kg"
                checked={ unit === 'kg' }
                onChange={ event => setUnit( event.target.value ) }
              />

              <label className="form-check-label" htmlFor="unit-kg">
                Kilograms
              </label>
            </div>
          </fieldset>

          <div className="mb-3">
            <label htmlFor="notes" className="form-label">
              Notes
            </label>

            <textarea
              id="notes"
              className="form-control"
              rows="3"
              placeholder="Optional workout notes"
              value={ notes }
              onChange={ event => setNotes( event.target.value ) }
            ></textarea>
          </div>

          <button type="submit" className="btn btn-primary w-100">
            { props.editingWorkout === null
              ? 'Add Exercise'
              : 'Update Exercise' }
          </button>

          { props.editingWorkout !== null &&
            <button
              type="button"
              className="btn btn-secondary w-100 mt-2"
              onClick={ clearForm }
            >
              Cancel Edit
            </button>
          }
        </form>
      </div>
    </div>
  )
}

export default WorkoutForm