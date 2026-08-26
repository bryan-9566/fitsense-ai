import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import ReactMarkdown from 'react-markdown';

import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  const [metrics, setMetrics] = useState(null);
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDashboard() {
    try {
      setLoading(true);
      setError('');

      const [analyticsResponse, aiResponse] =
        await Promise.all([
          api.get('/analytics/summary'),
          api.post('/ai/progress'),
        ]);

      setMetrics(analyticsResponse.data);

      setInsight(
        aiResponse.data?.analysis ||
          'Keep recording your workouts to generate personalized insights.'
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load your dashboard.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const trainingData = useMemo(() => {
    if (!metrics) return [];

    return [
      {
        name: '7 Days',
        workouts: metrics.workouts7Days,
      },
      {
        name: '30 Days',
        workouts: metrics.workouts30Days,
      },
      {
        name: 'Streak',
        workouts: metrics.currentStreak,
      },
    ];
  }, [metrics]);

  const goalData = useMemo(() => {
    if (!metrics) return [];

    return [
      {
        name: 'Active',
        value: metrics.activeGoals,
      },
      {
        name: 'Completed',
        value: metrics.completedGoals,
      },
    ];
  }, [metrics]);

  return (
    <div className="dashboard-page">
      <header className="page-header dashboard-header">
        <div>
          <p className="eyebrow">
            Performance dashboard
          </p>

          <h1>
            Good day, {user?.name || 'there'}
          </h1>

          <p className="page-description">
            Here is a snapshot of your recent training,
            consistency and progress.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={loadDashboard}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh data'}
        </button>
      </header>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="panel dashboard-loading">
          <div className="loading-dot" />
          <p>Analyzing your fitness data...</p>
        </div>
      ) : metrics ? (
        <>
          <section className="dashboard-metrics">
            <Metric
              label="30-day workouts"
              value={metrics.workouts30Days}
              subtitle="Training sessions"
            />

            <Metric
              label="7-day workouts"
              value={metrics.workouts7Days}
              subtitle="Recent activity"
            />

            <Metric
              label="Consistency"
              value={`${metrics.consistencyPercent}%`}
              subtitle="Last 30 days"
            />

            <Metric
              label="Current streak"
              value={`${metrics.currentStreak}d`}
              subtitle="Consecutive days"
            />
          </section>

          <section className="dashboard-secondary-metrics">
            <MiniMetric
              label="Calories burned"
              value={metrics.caloriesBurned}
            />

            <MiniMetric
              label="Training volume"
              value={`${metrics.trainingVolumeKg} kg`}
            />

            <MiniMetric
              label="Avg duration"
              value={`${metrics.averageDurationMin} min`}
            />

            <MiniMetric
              label="Goal completion"
              value={`${metrics.goalCompletionPercent}%`}
            />
          </section>

          <div className="dashboard-chart-grid">
            <section className="panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">
                    Activity
                  </p>

                  <h2>
                    Training pulse
                  </h2>
                </div>
              </div>

              <div className="chart dashboard-chart">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart data={trainingData}>
                    <CartesianGrid
                      stroke="#252a3a"
                      strokeDasharray="4 4"
                    />

                    <XAxis
                      dataKey="name"
                      stroke="#7f879b"
                    />

                    <YAxis
                      allowDecimals={false}
                      stroke="#7f879b"
                    />

                    <Tooltip
                      contentStyle={{
                        background: '#11141d',
                        border: '1px solid #303648',
                        borderRadius: '10px',
                        color: '#fff',
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="workouts"
                      stroke="#6d5dfc"
                      strokeWidth={3}
                      dot={{
                        r: 5,
                        fill: '#6d5dfc',
                      }}
                      activeDot={{
                        r: 7,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">
                    Goals
                  </p>

                  <h2>
                    Goal status
                  </h2>
                </div>
              </div>

              <div className="chart dashboard-chart">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart data={goalData}>
                    <CartesianGrid
                      stroke="#252a3a"
                      strokeDasharray="4 4"
                    />

                    <XAxis
                      dataKey="name"
                      stroke="#7f879b"
                    />

                    <YAxis
                      allowDecimals={false}
                      stroke="#7f879b"
                    />

                    <Tooltip
                      contentStyle={{
                        background: '#11141d',
                        border: '1px solid #303648',
                        borderRadius: '10px',
                        color: '#fff',
                      }}
                    />

                    <Bar
                      dataKey="value"
                      fill="#6d5dfc"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <div className="dashboard-summary-grid">
            <section className="panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">
                    Progress
                  </p>

                  <h2>
                    Fitness overview
                  </h2>
                </div>
              </div>

              <div className="summary-list">
                <SummaryRow
                  label="Workout consistency"
                  value={`${metrics.consistencyPercent}%`}
                />

                <SummaryRow
                  label="Training volume"
                  value={`${metrics.trainingVolumeKg} kg`}
                />

                <SummaryRow
                  label="Active goals"
                  value={metrics.activeGoals}
                />

                <SummaryRow
                  label="Completed goals"
                  value={metrics.completedGoals}
                />

                <SummaryRow
                  label="Current streak"
                  value={`${metrics.currentStreak} days`}
                />
              </div>
            </section>

            <section className="panel ai-dashboard-card">
              <div className="ai-header">
                <div>
                  <p className="eyebrow">
                    FitSense AI
                  </p>

                  <h2>
                    AI progress insight
                  </h2>
                </div>

                <span className="ai-badge">
                  GEMINI
                </span>
              </div>

              <div className="ai-insight-content">
                <div className="ai-icon">
                  ✦
                </div>

                <div className="ai-markdown dashboard-ai-markdown">
                  <ReactMarkdown>
                    {insight}
                  </ReactMarkdown>
                </div>
              </div>

              <div className="ai-disclaimer">
                Fitness-planning guidance based on your
                tracked application data. Not medical
                advice.
              </div>
            </section>
          </div>

          <section className="panel quick-actions-panel">
            <div>
              <p className="eyebrow">
                Continue training
              </p>

              <h2>
                Quick actions
              </h2>
            </div>

            <div className="quick-actions">
              <a
                href="/workouts"
                className="quick-action"
              >
                <strong>
                  Record workout
                </strong>

                <span>
                  Add today's training session
                </span>
              </a>

              <a
                href="/goals"
                className="quick-action"
              >
                <strong>
                  Update goals
                </strong>

                <span>
                  Track progress toward your targets
                </span>
              </a>

              <a
                href="/ai"
                className="quick-action"
              >
                <strong>
                  Ask AI Coach
                </strong>

                <span>
                  Get personalized fitness guidance
                </span>
              </a>
            </div>
          </section>
        </>
      ) : (
        <div className="panel empty-state">
          <h3>
            No analytics available
          </h3>

          <p>
            Record a few workouts and goals to start
            building your fitness dashboard.
          </p>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  subtitle,
}) {
  return (
    <div className="metric dashboard-main-metric">
      <span>{label}</span>

      <strong>{value}</strong>

      <small>{subtitle}</small>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="mini-metric">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="summary-row">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}