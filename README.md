# DOCS

## Why Add Refresh Tokens?

| Access Token                | Refresh Token                  |
| --------------------------- | ------------------------------ |
| Short-lived (e.g. 15 min)   | Long-lived (e.g. 7 days)       |
| Sent on every request       | Sent once to get new access    |
| Stored in memory or headers | Stored in **HTTP-only cookie** |
| Expires quickly             | Can rotate / revoke            |

## DOCS

### Why Swagger?

| Feature                | Benefit                              |
| ---------------------- | ------------------------------------ |
| 📖 Auto-generated docs | Based on code comments or decorators |
| ⚙️ Dev-friendly UI     | Try endpoints directly               |
| 🤝 Team sharing        | Share Postman-style docs via `/docs` |
| 🔐 Auth support        | Can test with bearer tokens          |

## Resources

- [Swagger Documentation](https://swagger.io/docs/specification/v3_0/about/)
