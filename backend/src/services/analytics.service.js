const Workout = require('../models/Workout');
const Goal = require('../models/Goal');

function startOfDay(date) {
  const d = new Date(date); d.setHours(0, 0, 0, 0); return d;
}

function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n); return d;
}

async function getAnalytics(userId) {
  const since30 = daysAgo(30);
  const since7 = daysAgo(7);
  const [workouts30, workouts7, goals] = await Promise.all([
    Workout.find({ user: userId, date: { $gte: since30 } }).lean(),
    Workout.find({ user: userId, date: { $gte: since7 } }).lean(),
    Goal.find({ user: userId }).lean()
  ]);

  const totalMinutes = workouts30.reduce((s, w) => s + (w.durationMin || 0), 0);
  const calories = workouts30.reduce((s, w) => s + (w.calories || 0), 0);
  const volumes = workouts30.reduce((s, w) => s + ((w.sets || 0) * (w.reps || 0) * (w.weightKg || 0)), 0);
  const activeGoals = goals.filter(g => g.status === 'ACTIVE');
  const completedGoals = goals.filter(g => g.status === 'COMPLETED');

  // A transparent consistency metric: days with at least one workout / 30 days.
  const uniqueDays = new Set(workouts30.map(w => startOfDay(w.date).toISOString())).size;
  const consistency = Math.round((uniqueDays / 30) * 100);

  let streak = 0;
  const workoutDays = new Set(workouts30.map(w => startOfDay(w.date).getTime()));
  let cursor = startOfDay(new Date());
  while (workoutDays.has(cursor.getTime())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    periodDays: 30,
    workouts30Days: workouts30.length,
    workouts7Days: workouts7.length,
    averageDurationMin: workouts30.length ? Math.round(totalMinutes / workouts30.length) : 0,
    caloriesBurned: calories,
    trainingVolumeKg: Math.round(volumes),
    consistencyPercent: consistency,
    currentStreak: streak,
    activeGoals: activeGoals.length,
    completedGoals: completedGoals.length,
    goalCompletionPercent: goals.length ? Math.round((completedGoals.length / goals.length) * 100) : 0
  };
}

module.exports = { getAnalytics };
