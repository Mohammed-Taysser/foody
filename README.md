# DOCS

## Why Add Refresh Tokens?

| Access Token                | Refresh Token                  |
| --------------------------- | ------------------------------ |
| Short-lived (e.g. 15 min)   | Long-lived (e.g. 7 days)       |
| Sent on every request       | Sent once to get new access    |
| Stored in memory or headers | Stored in **HTTP-only cookie** |
| Expires quickly             | Can rotate / revoke            |
