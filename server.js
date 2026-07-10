require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const session = require('express-session');
const path = require('path');
const { getDb } = require('./config/db');
const SqliteSessionStore = require('./config/sessionStore');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (needed when behind Render, Railway, etc.)
app.set('trust proxy', 1);

// Security headers (relax CSP for inline scripts used in story edit)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", "data:"],
    },
  },
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Boot: initialise DB first, then configure session with persistent store
getDb().then(() => {
  // Create SQLite-backed session store
  const store = new SqliteSessionStore();
  store.init();

  // Session (now persistent across restarts)
  app.use(session({
    store,
    secret: process.env.SESSION_SECRET || 'changeme',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
    },
  }));
  // Make session user available in all views
  app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
  });

  // Root redirect
  app.get('/', (req, res) => res.redirect('/dashboard'));

  // Routes
  app.use('/', require('./routes/auth'));
  app.use('/dashboard', require('./routes/dashboard'));
  app.use('/meetings', require('./routes/meetings'));
  app.use('/reports', require('./routes/reports'));
  app.use('/tasks', require('./routes/tasks'));
  app.use('/projects', require('./routes/projects'));
  app.use('/users', require('./routes/users'));

  // 404 handler
  app.use((req, res) => {
    res.status(404).send('<h1>404 — Page not found</h1><a href="/dashboard">Go to Dashboard</a>');
  });

  app.listen(PORT, () => {
    console.log(`Colaby running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialise database:', err);
  process.exit(1);
});
