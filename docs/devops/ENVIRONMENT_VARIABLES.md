# Environment Variables Guide

The Little Angels School ERP relies on the following environment variables. They must be configured in the `.env` file at the root of the project prior to starting the production containers.

## Critical Security Secrets
* `JWT_SECRET`: A highly secure random string used to sign JWT Access Tokens.
* `JWT_REFRESH_SECRET`: A separate secure string used to sign Refresh Tokens.
* `ENCRYPTION_KEY`: A 32-byte hex string used for database-level encryption of sensitive fields (e.g. passwords).

## Database Configuration
* `MONGODB_URI`: The full connection string to the MongoDB replica set or standalone instance. Example: `mongodb://user:pass@host:27017/laps?authSource=admin`

## Server Configuration
* `NODE_ENV`: Must be set to `production` to enable caching, suppress stack traces, and optimize Node.js performance.
* `PORT`: The port the API runs on internally. Usually `5000`.

## SMTP / Email Config
* `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: Credentials used by the communication module to dispatch notifications and scheduled reports.
* `EMAIL_FROM`: Default sender address for system notifications.

## Storage (Future-Proofing)
* `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`: Used for syncing database backup archives.
