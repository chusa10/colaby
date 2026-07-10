# Tech Stack

## Stack

- **Runtime**: Node.js
- **Backend**: Express.js (HTTP server, routing, session handling)
- **Frontend**: Vanilla HTML, CSS, JavaScript (no frontend framework)
- **Templating**: EJS (server-side rendered views)
- **Database**: SQLite (via `better-sqlite3`) — simple, file-based, no separate server needed
- **Auth**: Session-based authentication (`express-session`)
- **Package Manager**: npm

## Key Libraries

| Package | Purpose |
|---|---|
| `express` | Web framework |
| `ejs` | HTML templating |
| `better-sqlite3` | SQLite database |
| `express-session` | User sessions |
| `bcrypt` | Password hashing |
| `nodemailer` | Sending email invitations |

## Common Commands

```bash
# Install dependencies
npm install

# Start the app (production)
node server.js

# Start the app (development, auto-restart)
npx nodemon server.js
```

## Environment Variables

Store secrets in a `.env` file at the project root (never commit this file):

```
PORT=3000
SESSION_SECRET=your-secret-here
EMAIL_USER=your@email.com
EMAIL_PASS=your-email-password
```

Use the `dotenv` package to load them: `require('dotenv').config()`
