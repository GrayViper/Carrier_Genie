# CareerGenie Auth Server

Lightweight Express server to provide JWT + bcrypt authentication for the CareerGenie frontend.

Endpoints:
- `POST /api/auth/register` {name,email,password,role} -> {user, token}
- `POST /api/auth/login` {email,password,role} -> {user, token}
- `GET /api/users/:id` (Bearer token) -> {user}
- `PUT /api/users/:id` (Bearer token) -> {user}

Start:

```bash
cd server
npm install
npm start
```

Default port: 5178
Default JWT secret: `dev_secret_please_change` (set `AUTH_JWT_SECRET` to override)
