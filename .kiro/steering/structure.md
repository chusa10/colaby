# Project Structure

```
colab/
├── server.js                  # Entry point — starts Express server
├── package.json
├── .env                       # Environment variables (not committed)
├── .gitignore
│
├── config/
│   └── db.js                  # SQLite connection and schema setup
│
├── routes/
│   ├── auth.js                # Sign-in, sign-out
│   ├── dashboard.js           # Home dashboard after login
│   ├── meetings.js            # Meeting minutes CRUD
│   ├── reports.js             # Weekly reports CRUD
│   ├── tasks.js               # Task tracker CRUD
│   └── projects.js            # Project tracker CRUD
│
├── controllers/
│   ├── authController.js
│   ├── meetingsController.js
│   ├── reportsController.js
│   ├── tasksController.js
│   └── projectsController.js
│
├── middleware/
│   └── authMiddleware.js      # Protect routes — redirect to login if not authenticated
│
├── views/                     # EJS templates
│   ├── layout/
│   │   ├── header.ejs
│   │   └── footer.ejs
│   ├── auth/
│   │   └── login.ejs
│   ├── dashboard.ejs
│   ├── meetings/
│   │   ├── index.ejs          # List all meeting minutes
│   │   ├── view.ejs           # View a single entry
│   │   └── form.ejs           # Create / edit form
│   ├── reports/
│   │   ├── index.ejs
│   │   ├── view.ejs
│   │   └── form.ejs
│   ├── tasks/
│   │   ├── index.ejs
│   │   ├── view.ejs
│   │   └── form.ejs
│   └── projects/
│       ├── index.ejs
│       ├── view.ejs
│       └── form.ejs
│
├── public/                    # Static assets served directly
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── main.js
│   └── images/
│
└── database/
    └── colab.db               # SQLite database file (not committed)
```

## Conventions

- Routes handle URL mapping only; business logic lives in controllers
- All protected routes use `authMiddleware.js` to verify session
- Views use shared `header.ejs` / `footer.ejs` partials for consistent layout
- Static files (CSS, client JS, images) go in `public/`
- Database file and `.env` are excluded from version control via `.gitignore`
