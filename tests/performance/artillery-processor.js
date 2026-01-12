/**
 * Artillery processor for custom logic
 */

module.exports = {
  // Generate random test data
  generateRandomEmail: () => {
    return `test-${Math.random().toString(36).substring(7)}@example.com`;
  },

  // Custom validation
  validateResponse: (requestParams, response, context, ee, next) => {
    if (response.statusCode !== 200 && response.statusCode !== 201) {
      console.error(`Request failed: ${requestParams.url} - Status: ${response.statusCode}`);
    }
    return next();
  },

  // Log slow requests
  logSlowRequests: (requestParams, response, context, ee, next) => {
    const duration = response.timings.duration;
    if (duration > 1000) {
      console.warn(`Slow request detected: ${requestParams.url} - Duration: ${duration}ms`);
    }
    return next();
  },
};
