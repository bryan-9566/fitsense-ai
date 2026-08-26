import { useEffect, useState } from 'react';
import api from '../services/api';

const initialForm = {
  exercise: '',
  category: 'STRENGTH',
  durationMin: '',
  calories: '',
  sets: '',
  reps: '',
  weightKg: '',
  intensity: '',
  notes: '',
};

export default function Workouts() {
  const [form, setForm] = useState(initialForm);
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadWorkouts() {
    try {
      setLoading(true);
      setError('');

      const { data } = await api.get('/workouts?limit=50');
      setItems(data.items || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load workouts.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkouts();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function startEdit(workout) {
    setEditingId(workout._id);

    setForm({
      exercise: workout.exercise || '',
      category: workout.category || 'STRENGTH',
      durationMin: workout.durationMin ?? '',
      calories: workout.calories ?? '',
      sets: workout.sets ?? '',
      reps: workout.reps ?? '',
      weightKg: workout.weightKg ?? '',
      intensity: workout.intensity ?? '',
      notes: workout.notes || '',
    });

    setError('');
    setMessage('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(initialForm);
    setError('');
    setMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (editingId) {
        await api.put(`/workouts/${editingId}`, form);
        setMessage('Workout updated successfully.');
      } else {
        await api.post('/workouts', form);
        setMessage('Workout recorded successfully.');
      }

      setForm(initialForm);
      setEditingId(null);

      await loadWorkouts();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        `Unable to ${editingId ? 'update' : 'save'} workout.`
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this workout?'
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError('');
      setMessage('');

      await api.delete(`/workouts/${id}`);

      if (editingId === id) {
        cancelEdit();
      }

      setMessage('Workout deleted successfully.');
      await loadWorkouts();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to delete workout.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <header className="page-header">
        <div>
          <p className="eyebrow">Training log</p>
          <h1>Workouts</h1>
          <p className="page-description">
            Record your training and track your performance over time.
          </p>
        </div>
      </header>

      {(error || message) && (
        <div className={error ? 'alert error' : 'alert success'}>
          {error || message}
        </div>
      )}

      <div className="grid-2 workouts-layout">
        {/* FORM */}
        <section className="panel workout-form-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {editingId ? 'Update session' : 'New session'}
              </p>

              <h2>
                {editingId ? 'Edit workout' : 'Record a workout'}
              </h2>
            </div>

            {editingId && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            )}
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field full">
              <label htmlFor="exercise">Exercise</label>
              <input
                id="exercise"
                name="exercise"
                type="text"
                placeholder="e.g. Bench Press"
                value={form.exercise}
                onChange={handleChange}
                required
                maxLength={100}
              />
            </div>

            <div className="field">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option value="STRENGTH">Strength</option>
                <option value="CARDIO">Cardio</option>
                <option value="FLEXIBILITY">Flexibility</option>
                <option value="SPORT">Sport</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="durationMin">Duration</label>
              <input
                id="durationMin"
                name="durationMin"
                type="number"
                min="1"
                max="600"
                placeholder="Minutes"
                value={form.durationMin}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="calories">Calories</label>
              <input
                id="calories"
                name="calories"
                type="number"
                min="0"
                placeholder="e.g. 350"
                value={form.calories}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="intensity">Intensity</label>
              <input
                id="intensity"
                name="intensity"
                type="number"
                min="1"
                max="10"
                placeholder="1–10"
                value={form.intensity}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="sets">Sets</label>
              <input
                id="sets"
                name="sets"
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 3"
                value={form.sets}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="reps">Reps</label>
              <input
                id="reps"
                name="reps"
                type="number"
                min="0"
                max="1000"
                placeholder="e.g. 10"
                value={form.reps}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="weightKg">Weight</label>
              <input
                id="weightKg"
                name="weightKg"
                type="number"
                min="0"
                max="1000"
                step="0.5"
                placeholder="kg"
                value={form.weightKg}
                onChange={handleChange}
              />
            </div>

            <div className="field full">
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                rows="4"
                placeholder="How did the workout feel?"
                value={form.notes}
                onChange={handleChange}
                maxLength={500}
              />
            </div>

            <div className="form-actions full">
              <button
                className="btn btn-primary btn-full"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Update workout'
                    : 'Save workout'}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="btn btn-secondary btn-full"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  Cancel editing
                </button>
              )}
            </div>
          </form>
        </section>

        {/* LIST */}
        <section className="panel workout-list-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">History</p>
              <h2>Recent activity</h2>
            </div>

            <span className="count-badge">
              {items.length}
            </span>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="loading-dot" />
              <p>Loading workouts...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">+</div>
              <h3>No workouts yet</h3>
              <p>
                Record your first workout to start building your
                performance history.
              </p>
            </div>
          ) : (
            <div className="workout-list">
              {items.map((workout) => (
                <article className="workout-card" key={workout._id}>
                  <div className="workout-card-top">
                    <div>
                      <h3>{workout.exercise}</h3>
                      <span className="tag">
                        {workout.category}
                      </span>
                    </div>

                    <span className="workout-date">
                      {new Date(workout.date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="workout-stats">
                    <div>
                      <span>Duration</span>
                      <strong>{workout.durationMin} min</strong>
                    </div>

                    <div>
                      <span>Calories</span>
                      <strong>{workout.calories || 0}</strong>
                    </div>

                    <div>
                      <span>Sets</span>
                      <strong>{workout.sets ?? '-'}</strong>
                    </div>

                    <div>
                      <span>Reps</span>
                      <strong>{workout.reps ?? '-'}</strong>
                    </div>

                    <div>
                      <span>Weight</span>
                      <strong>
                        {workout.weightKg != null
                          ? `${workout.weightKg} kg`
                          : '-'}
                      </strong>
                    </div>

                    <div>
                      <span>Intensity</span>
                      <strong>
                        {workout.intensity
                          ? `${workout.intensity}/10`
                          : '-'}
                      </strong>
                    </div>
                  </div>

                  {workout.notes && (
                    <div className="workout-notes">
                      {workout.notes}
                    </div>
                  )}

                  <div className="workout-actions">
                    <button
                      type="button"
                      className="btn btn-action btn-edit"
                      onClick={() => startEdit(workout)}
                      disabled={deletingId === workout._id}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="btn btn-action btn-delete"
                      onClick={() => handleDelete(workout._id)}
                      disabled={deletingId === workout._id}
                    >
                      {deletingId === workout._id
                        ? 'Deleting...'
                        : 'Delete'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}