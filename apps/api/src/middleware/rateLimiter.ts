import rateLimit from 'express-rate-limit';
import { ErrorCodes } from '@laps/shared';
import { sendError } from '../utils/response';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    void req;
    sendError(
      res,
      429,
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      'Too many requests from this IP, please try again after 15 minutes.',
    );
  },
  skip: () => process.env.NODE_ENV === 'test', // Do not rate limit during automated test runs
});
