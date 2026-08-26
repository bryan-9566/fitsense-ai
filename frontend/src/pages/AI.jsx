import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';

export default function AI() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [plan, setPlan] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [source, setSource] = useState('');
  const [planSource, setPlanSource] = useState('');

  async function ask() {
    const cleanQuestion = question.trim();

    if (!cleanQuestion) {
      setError('Enter a question for the AI Coach.');
      return;
    }

    setLoading(true);
    setError('');
    setAnswer('');
    setSource('');

    try {
      const { data } = await api.post('/ai/coach', {
        question: cleanQuestion,
      });

      setAnswer(data.answer || '');
      setSource(data.source || 'GEMINI');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'The AI Coach request failed.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function generate() {
    setLoading(true);
    setError('');
    setPlan(null);
    setPlanSource('');

    try {
      const { data } = await api.post('/ai/workout-plan', {});

      setPlan(data);
      setPlanSource(data.source || 'GEMINI');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to generate the workout plan.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Personalized intelligence</p>

          <h1>AI Coach</h1>

          <p className="page-description">
            Ask questions about your tracked fitness data
            and generate personalized workout plans.
          </p>
        </div>
      </header>

      {error && (
        <div className="alert error">
          <strong>AI request failed</strong>

          <div style={{ marginTop: 6 }}>
            {error}
          </div>
        </div>
      )}

      <div className="grid-2">
        {/* =========================
            AI COACH
        ========================= */}

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">AI Coach</p>
              <h2>Ask your coach</h2>
            </div>

            <span className="ai-badge">
              {source || 'GEMINI'}
            </span>
          </div>

          <textarea
            rows="7"
            placeholder="Example: Analyze my current muscle-gain progress."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
          />

          <button
            className="btn btn-primary btn-full"
            onClick={ask}
            disabled={loading}
            style={{ marginTop: 12 }}
          >
            {loading ? 'Thinking...' : 'Ask AI Coach'}
          </button>

          {answer && (
            <div className="ai-result">
              <div className="ai-result-header">
                <div>
                  <p className="eyebrow">Coach response</p>
                  <h3>Personalized insight</h3>
                </div>

                <span className="ai-badge">
                  {source || 'GEMINI'}
                </span>
              </div>

              <div className="ai-markdown">
                <ReactMarkdown>
                  {answer}
                </ReactMarkdown>
              </div>

              <div className="ai-disclaimer">
                Fitness-planning guidance based on
                tracked application data. Not medical advice.
              </div>
            </div>
          )}
        </section>

        {/* =========================
            WORKOUT GENERATOR
        ========================= */}

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">AI Planning</p>
              <h2>Generate workout plan</h2>
            </div>

            {planSource && (
              <span className="ai-badge">
                {planSource}
              </span>
            )}
          </div>

          <p className="muted">
            FitSense AI uses your saved profile, equipment,
            goals and recent activity to create a
            personalized workout plan.
          </p>

          <button
            className="btn btn-primary btn-full"
            onClick={generate}
            disabled={loading}
            style={{ marginTop: 12 }}
          >
            {loading ? 'Generating...' : 'Generate plan'}
          </button>

          {plan && (
            <div className="plan">
              <div className="ai-result-header">
                <div>
                  <p className="eyebrow">
                    Generated plan
                  </p>

                  <h3>
                    {plan.title || 'Personalized plan'}
                  </h3>
                </div>

                <span className="ai-badge">
                  {planSource || 'GEMINI'}
                </span>
              </div>

              {plan.goal && (
                <span className="tag">
                  {String(plan.goal).replaceAll('_', ' ')}
                </span>
              )}

              {plan.days?.map((day) => (
                <div
                  className="plan-day"
                  key={day.day}
                >
                  <strong>
                    {day.day} · {day.focus}
                  </strong>

                  {day.exercises?.map((exercise) => (
                    <span key={exercise.name}>
                      {exercise.name} · {exercise.sets} sets ·{' '}
                      {exercise.reps} · {exercise.restSeconds}s rest
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}