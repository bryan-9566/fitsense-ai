const express = require('express');
const cors = require('cors');

const {
  notFound,
  errorHandler,
} = require('./middleware/error');

const app = express();

app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN || '*',
  })
);

app.use(
  express.json({
    limit: '1mb',
  })
);

app.use((req, _res, next) => {
  console.log(
    `${req.method} ${req.originalUrl}`
  );

  next();
});

/* =========================
   HEALTH
========================= */

app.get(
  '/api/health',
  (req, res) =>
    res.json({
      ok: true,
      service: 'fitsense-ai-backend',
    })
);

/* =========================
   API ROUTES
========================= */

app.use(
  '/api/auth',
  require('./routes/auth.routes')
);

app.use(
  '/api/users',
  require('./routes/user.routes')
);

app.use(
  '/api/workouts',
  require('./routes/workout.routes')
);

app.use(
  '/api/goals',
  require('./routes/goal.routes')
);

app.use(
  '/api/analytics',
  require('./routes/analytics.routes')
);

app.use(
  '/api/ai',
  require('./routes/ai.routes')
);

app.use(
  '/api/workout-plans',
  require('./routes/workoutPlan.routes')
);

app.use(
  '/api/admin',
  require('./routes/admin.routes')
);

/* =========================
   ERROR HANDLING
========================= */

app.use(notFound);
app.use(errorHandler);

module.exports = app;