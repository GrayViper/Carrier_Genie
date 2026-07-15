# Security Checklist

This checklist captures the minimum security requirements for JWT-based authentication and production deployment in CareerGenie.

## JWT / Authentication
- [x] Use a strong secret in production: `JWT_SECRET` must be set to a high-entropy value.
- [x] Require `JWT_SECRET` when `NODE_ENV=production`.
- [x] Use a fixed JWT signing algorithm: `HS256` is enforced in `server/mock-server.js`.
- [x] Verify JWT algorithm explicitly when decoding tokens.
- [x] Keep JWT expiry short enough for session security, but long enough for usability (currently `7d`).
- [x] Protect all authenticated routes with `authMiddleware`.
- [x] Do not allow fallback dev login in production; `ALLOW_DEV_AUTH=1` is only for development.

## Password security
- [x] Hash passwords using bcrypt with a work factor of at least 12.
- [x] Never store plaintext passwords.
- [x] Remove `passwordHash` from API responses.

## Transport and deployment
- [x] Enforce HTTPS/TLS in production or front-end proxy.
- [x] Restrict allowed CORS origins to known frontend hosts.
- [x] Do not expose tokens in URLs or logs. Client auth flow should use headers and avoid query-string token transport.
- [x] Use secure cookie attributes or secure client storage for session tokens. Production deployments should choose a secure storage approach and never log raw tokens.

## Headers and hardening
- [x] Set `X-Content-Type-Options: nosniff`.
- [x] Set `X-Frame-Options: DENY`.
- [x] Set `Referrer-Policy: no-referrer`.
- [x] Set `Permissions-Policy` to disable unused browser features.

## Project notes
- `server/mock-server.js` now includes JWT production enforcement and response header hardening.
- Client token transport currently uses Authorization headers and avoids exposing tokens in URLs; production deployments should still use secure storage and never log raw tokens.
- `TODO.md` and `docs/WORKFLOW_LOG.md` must be updated whenever tasks are completed or security work is added.
