import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Adaptive() {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [exercise, setExercise] = useState(null);

  const [form, setForm] = useState({
    plannedWeight: '',
    actualBestWeight: '',
    plannedReps: '',
    actualBestReps: '',
    intensity: 7,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function loadPlans() {
    try {
      setLoading(true);
      setError('');

      // We use the existing AI plan endpoint response structure.
      // This request generates a fresh plan for now.
      const { data } = await api.post('/ai/workout-plan', {});

      setPlans([data]);

      if (data.days?.length > 0) {
        setSelectedPlan(data);

        const firstExercise =
          data.days[0]?.exercises?.[0];

        if (firstExercise) {
          setExercise(firstExercise);

          setForm((current) => ({
            ...current,
            plannedReps:
              firstExercise.reps
                ?.toString()
                .split('-')[0] || '',
          }));
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load an adaptive workout plan.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlans();
  }, []);

  function selectExercise(day, selectedExercise) {
    setExercise(selectedExercise);
    setResult(null);

    const plannedReps =
      selectedExercise.reps
        ?.toString()
        .split('-')[0]
        .replace(/[^0-9]/g, '');

    setForm({
      plannedWeight: '',
      actualBestWeight: '',
      plannedReps: plannedReps || '',
      actualBestReps: '',
      intensity: 7,
    });

    setSelectedPlan({
      ...selectedPlan,
      selectedDay: day,
    });
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError('');
  }

  async function evaluatePerformance(event) {
    event.preventDefault();

    setSubmitting(true);
    setError('');
    setResult(null);

    try {
      const payload = {
        plannedWeight: Number(form.plannedWeight) || 0,
        actualBestWeight:
          Number(form.actualBestWeight) || 0,
        plannedReps: Number(form.plannedReps),
        actualBestReps:
          Number(form.actualBestReps),
        intensity: Number(form.intensity),
      };

      const { data } = await api.post(
        '/ai/adaptive',
        payload
      );

      setResult(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to evaluate your performance.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-dot" />
        <p>Preparing your adaptive workout...</p>
      </div>
    );
  }

  return (
    <div className="adaptive-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">
            Adaptive training
          </p>

          <h1>Performance Engine</h1>

          <p className="page-description">
            Complete an exercise, record your actual
            performance, and let FitSense determine the
            next training adjustment.
          </p>
        </div>
      </header>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <div className="adaptive-layout">
        {/* PLAN */}
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                Current plan
              </p>

              <h2>
                {selectedPlan?.title ||
                  'AI Workout Plan'}
              </h2>
            </div>

            <span className="ai-badge">
              GEMINI
            </span>
          </div>

          <div className="adaptive-days">
            {selectedPlan?.days?.map(
              (day) => (
                <div
                  className="adaptive-day"
                  key={day.day}
                >
                  <div className="adaptive-day-header">
                    <div>
                      <strong>
                        {day.day}
                      </strong>

                      <span>
                        {day.focus}
                      </span>
                    </div>
                  </div>

                  <div className="adaptive-exercises">
                    {day.exercises?.map(
                      (item) => {
                        const active =
                          exercise?.name ===
                          item.name;

                        return (
                          <button
                            type="button"
                            key={item.name}
                            className={
                              active
                                ? 'adaptive-exercise selected'
                                : 'adaptive-exercise'
                            }
                            onClick={() =>
                              selectExercise(
                                day,
                                item
                              )
                            }
                          >
                            <strong>
                              {item.name}
                            </strong>

                            <span>
                              {item.sets} sets ·{' '}
                              {item.reps} ·{' '}
                              {item.restSeconds}s
                              rest
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {/* PERFORMANCE */}
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                Performance input
              </p>

              <h2>
                {exercise?.name ||
                  'Select an exercise'}
              </h2>
            </div>
          </div>

          {!exercise ? (
            <div className="empty-state">
              <h3>Select an exercise</h3>
              <p>
                Choose an exercise from the plan to
                record your performance.
              </p>
            </div>
          ) : (
            <form
              className="form-grid"
              onSubmit={evaluatePerformance}
            >
              <div className="adaptive-target full">
                <div>
                  <span>
                    Planned target
                  </span>

                  <strong>
                    {exercise.sets} sets ×{' '}
                    {exercise.reps}
                  </strong>
                </div>

                <div>
                  <span>
                    Rest
                  </span>

                  <strong>
                    {exercise.restSeconds}s
                  </strong>
                </div>
              </div>

              <div className="field">
                <label>
                  Planned weight
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.5"
                  name="plannedWeight"
                  value={
                    form.plannedWeight
                  }
                  onChange={handleChange}
                  placeholder="e.g. 60"
                />
              </div>

              <div className="field">
                <label>
                  Actual best weight
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.5"
                  name="actualBestWeight"
                  value={
                    form.actualBestWeight
                  }
                  onChange={handleChange}
                  placeholder="e.g. 62.5"
                />
              </div>

              <div className="field">
                <label>
                  Planned reps
                </label>

                <input
                  type="number"
                  min="1"
                  name="plannedReps"
                  value={form.plannedReps}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="field">
                <label>
                  Actual best reps
                </label>

                <input
                  type="number"
                  min="0"
                  name="actualBestReps"
                  value={
                    form.actualBestReps
                  }
                  onChange={handleChange}
                  placeholder="e.g. 8"
                  required
                />
              </div>

              <div className="field full">
                <label>
                  Session intensity: {form.intensity}/10
                </label>

                <input
                  type="range"
                  min="1"
                  max="10"
                  name="intensity"
                  value={form.intensity}
                  onChange={handleChange}
                />
              </div>

              <button
                className="btn btn-primary btn-full full"
                type="submit"
                disabled={submitting}
              >
                {submitting
                  ? 'Evaluating...'
                  : 'Evaluate performance'}
              </button>
            </form>
          )}

          {/* RESULT */}
          {result && (
            <div className="adaptive-result">
              <div className="adaptive-result-header">
                <div>
                  <p className="eyebrow">
                    Next-session decision
                  </p>

                  <h2>
                    {result.decision}
                  </h2>
                </div>

                <span
                  className={`decision-badge ${String(
                    result.decision
                  ).toLowerCase()}`}
                >
                  {result.decision}
                </span>
              </div>

              <p>
                {result.recommendation}
              </p>

              <div className="adaptive-input-summary">
                <span>
                  Planned: {result.inputs.plannedWeight || 0} kg ×{' '}
                  {result.inputs.plannedReps} reps
                </span>

                <span>
                  Actual: {result.inputs.actualBestWeight || 0} kg ×{' '}
                  {result.inputs.actualBestReps} reps
                </span>

                <span>
                  Intensity: {result.inputs.intensity}/10
                </span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}