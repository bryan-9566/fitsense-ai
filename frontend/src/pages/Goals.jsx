import { useEffect, useState } from 'react';
import api from '../services/api';

const initialForm = {
  title: '',
  metric: 'WORKOUTS',
  target: '',
  current: 0,
  status: 'ACTIVE',
};

export default function Goals() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadGoals() {
    try {
      setLoading(true);
      setError('');

      const { data } = await api.get('/goals');
      setItems(data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load goals.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGoals();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function startEdit(goal) {
    setEditingId(goal._id);

    setForm({
      title: goal.title || '',
      metric: goal.metric || 'WORKOUTS',
      target: goal.target ?? '',
      current: goal.current ?? 0,
      status: goal.status || 'ACTIVE',
    });

    setMessage('');
    setError('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(initialForm);
    setMessage('');
    setError('');
  }

  async function saveGoal(event) {
    event.preventDefault();

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const payload = {
        title: form.title,
        metric: form.metric,
        target: Number(form.target),
        current: Number(form.current),
        status: form.status,
      };

      if (editingId) {
        await api.put(`/goals/${editingId}`, payload);
        setMessage('Goal updated successfully.');
      } else {
        await api.post('/goals', payload);
        setMessage('Goal created successfully.');
      }

      setForm(initialForm);
      setEditingId(null);

      await loadGoals();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        `Unable to ${editingId ? 'update' : 'create'} goal.`
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateProgress(goal, newCurrent) {
    const current = Math.max(
      0,
      Math.min(Number(newCurrent), Number(goal.target))
    );

    const status =
      current >= Number(goal.target)
        ? 'COMPLETED'
        : 'ACTIVE';

    try {
      setError('');
      setMessage('');

      await api.put(`/goals/${goal._id}`, {
        title: goal.title,
        metric: goal.metric,
        target: Number(goal.target),
        current,
        status,
      });

      setMessage('Goal progress updated.');
      await loadGoals();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to update goal progress.'
      );
    }
  }

  async function deleteGoal(id) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this goal?'
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError('');
      setMessage('');

      await api.delete(`/goals/${id}`);

      if (editingId === id) {
        cancelEdit();
      }

      setMessage('Goal deleted successfully.');
      await loadGoals();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to delete goal.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <header className="page-header">
        <div>
          <p className="eyebrow">Progress targets</p>
          <h1>Goals</h1>
          <p className="page-description">
            Set targets, update your progress, and track completion.
          </p>
        </div>
      </header>

      {(error || message) && (
        <div className={error ? 'alert error' : 'alert success'}>
          {error || message}
        </div>
      )}

      <div className="grid-2">
        {/* CREATE / EDIT */}
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {editingId ? 'Update target' : 'New target'}
              </p>

              <h2>
                {editingId ? 'Edit goal' : 'Create goal'}
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

          <form className="form-grid" onSubmit={saveGoal}>
            <div className="field full">
              <label htmlFor="title">Goal title</label>

              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. Complete 20 workouts"
                value={form.title}
                onChange={handleChange}
                required
                maxLength={100}
              />
            </div>

            <div className="field">
              <label htmlFor="metric">Metric</label>

              <select
                id="metric"
                name="metric"
                value={form.metric}
                onChange={handleChange}
              >
                <option value="WORKOUTS">Workouts</option>
                <option value="CALORIES">Calories</option>
                <option value="DURATION">Duration</option>
                <option value="STRENGTH">Strength</option>
                <option value="STREAK">Streak</option>
                <option value="WEIGHT">Weight</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="target">Target</label>

              <input
                id="target"
                name="target"
                type="number"
                min="1"
                step="0.01"
                placeholder="Target value"
                value={form.target}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="current">Current progress</label>

              <input
                id="current"
                name="current"
                type="number"
                min="0"
                step="0.01"
                placeholder="Current value"
                value={form.current}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="status">Status</label>

              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div className="form-actions full">
              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Update goal'
                    : 'Create goal'}
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

        {/* GOALS LIST */}
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Your targets</p>
              <h2>Goals</h2>
            </div>

            <span className="count-badge">
              {items.length}
            </span>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="loading-dot" />
              <p>Loading goals...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">+</div>

              <h3>No goals yet</h3>

              <p>
                Create your first fitness goal to start tracking
                progress.
              </p>
            </div>
          ) : (
            <div className="goals-list">
              {items.map((goal) => {
                const target = Number(goal.target) || 0;
                const current = Number(goal.current) || 0;

                const percentage =
                  target > 0
                    ? Math.min(
                        100,
                        Math.round((current / target) * 100)
                      )
                    : 0;

                return (
                  <article className="goal-card" key={goal._id}>
                    <div className="goal-card-top">
                      <div>
                        <h3>{goal.title}</h3>

                        <span className="tag">
                          {goal.metric}
                        </span>
                      </div>

                      <span
                        className={
                          goal.status === 'COMPLETED'
                            ? 'status-badge completed'
                            : 'status-badge active'
                        }
                      >
                        {goal.status}
                      </span>
                    </div>

                    <div className="goal-progress">
                      <div className="goal-progress-header">
                        <span>
                          {current} / {target}
                        </span>

                        <strong>{percentage}%</strong>
                      </div>

                      <div className="progress">
                        <div
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* QUICK PROGRESS CONTROLS */}
                    <div className="progress-controls">
                      <button
                        type="button"
                        className="btn btn-action btn-edit"
                        disabled={current <= 0}
                        onClick={() =>
                          updateProgress(
                            goal,
                            Math.max(0, current - 1)
                          )
                        }
                      >
                        −1
                      </button>

                      <button
                        type="button"
                        className="btn btn-action btn-edit"
                        onClick={() =>
                          updateProgress(
                            goal,
                            Math.min(target, current + 1)
                          )
                        }
                      >
                        +1
                      </button>

                      <input
                        type="number"
                        min="0"
                        max={target}
                        step="0.01"
                        defaultValue={current}
                        onBlur={(event) => {
                          const value = Number(
                            event.target.value
                          );

                          if (
                            !Number.isNaN(value) &&
                            value !== current
                          ) {
                            updateProgress(goal, value);
                          }
                        }}
                        className="progress-input"
                      />
                    </div>

                    {/* ACTIONS */}
                    <div className="goal-actions">
                      <button
                        type="button"
                        className="btn btn-action btn-edit"
                        onClick={() => startEdit(goal)}
                        disabled={deletingId === goal._id}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="btn btn-action btn-delete"
                        onClick={() => deleteGoal(goal._id)}
                        disabled={deletingId === goal._id}
                      >
                        {deletingId === goal._id
                          ? 'Deleting...'
                          : 'Delete'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}