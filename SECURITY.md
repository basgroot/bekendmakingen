# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest on `main` | :white_check_mark: |

Only the latest version deployed from the `main` branch is actively maintained and receives security fixes.

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly. **Do not open a public GitHub issue for security vulnerabilities.**

Instead, please use one of the following methods:

1. **GitHub Private Vulnerability Reporting** -- use the [Security Advisories](https://github.com/basgroot/bekendmakingen/security/advisories/new) feature to report a vulnerability privately.
2. **Email** -- if the above is not available, reach out to the repository owner via their [GitHub profile](https://github.com/basgroot).

### What to Include

When reporting a vulnerability, please provide as much of the following as possible:

- A description of the vulnerability and its potential impact
- Steps to reproduce the issue
- Affected files or components
- Any suggestions for a fix, if applicable

### What to Expect

- You will receive an acknowledgement within **7 days** of your report.
- The maintainer will work with you to understand and validate the issue.
- A fix will be developed and released as soon as practical, depending on severity.
- You will be credited in the fix (unless you prefer to remain anonymous).

## Scope

This is a client-side-only web application with no backend, no database, and no user authentication. The primary security concerns are:

- **Third-party API usage** -- the application loads the Google Maps JavaScript API and fetches public data from `repository.overheid.nl`.
- **Client-side code integrity** -- ensuring the JavaScript served to users has not been tampered with or made to behave maliciously.
- **Dependency supply chain** -- development dependencies (ESLint, Prettier) are managed via npm.

## Security Measures in Place

- **CodeQL analysis** -- automated static analysis runs on pushes and pull requests to the `main` branch via GitHub Actions.
- **Dependabot** -- configured to monitor for known vulnerabilities in dependencies.
- **No server-side attack surface** -- the application is purely client-side and serves public, non-sensitive government data.

## Out of Scope

The following are **not** considered vulnerabilities in this project:

- Issues in third-party services (Google Maps API, `repository.overheid.nl`) -- please report those to the respective service providers.
- Browser-specific bugs unrelated to this project's code.
- Issues that require physical access to a user's device.
