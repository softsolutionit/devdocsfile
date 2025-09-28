class RateLimiter {
  constructor(options = {}) {
    this.interval = options.interval || 60000; // Default: 1 minute
    this.uniqueTokenPerInterval = options.uniqueTokenPerInterval || 500;
    this.tokens = new Map();
  }

  async check(limit, token) {
    const now = Date.now();
    
    // Initialize token data if it doesn't exist
    if (!this.tokens.has(token)) {
      this.tokens.set(token, {
        count: 0,
        lastReset: now,
        resetTime: now + this.interval
      });
    }

    const tokenData = this.tokens.get(token);
    
    // Reset counter if interval has passed
    if (now > tokenData.resetTime) {
      tokenData.count = 0;
      tokenData.lastReset = now;
      tokenData.resetTime = now + this.interval;
    }

    // Check if rate limit is exceeded
    if (tokenData.count >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: tokenData.resetTime,
        resetAfter: tokenData.resetTime - now
      };
    }

    // Increment counter
    tokenData.count += 1;

    // Clean up old tokens to prevent memory leaks
    if (this.tokens.size > this.uniqueTokenPerInterval) {
      const now = Date.now();
      for (const [key, value] of this.tokens.entries()) {
        if (now > value.resetTime + this.interval * 2) {
          this.tokens.delete(key);
        }
      }
    }

    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - tokenData.count),
      reset: tokenData.resetTime,
      resetAfter: tokenData.resetTime - now
    };
  }
}

// In-memory store for development
// In production, you might want to use Redis or similar for distributed rate limiting
const rateLimiters = new Map();

function getRateLimiter(key, options = {}) {
  if (!rateLimiters.has(key)) {
    rateLimiters.set(key, new RateLimiter(options));
  }
  return rateLimiters.get(key);
}

// module.exports = {
//   RateLimiter,
//   getRateLimiter
// };

// For ES modules
export { RateLimiter, getRateLimiter };
