# Historical API implementations

These files preserve the original server implementations for code review. The `.ts.txt` extension and location outside `app/` keep them out of Next.js routing and compilation.

The review found missing authentication and ownership checks, including an application lookup that returned borrower records by ID. Other routes can invoke paid providers, write database records, or send email. These implementations must not be restored as live handlers without authentication, record-level authorization, input validation, rate limits, and isolated integration tests.

The runnable `/api` boundary returns HTTP 503 for every supported method. There is no environment-variable switch to enable these archived handlers. This change contains backend behavior in the portfolio copy; it does not patch or make claims about the original deployed product.
