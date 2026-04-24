# Contributing to Bouwmelding.nl

Thank you for your interest in contributing! This project displays Dutch government publications (vergunningen) on an interactive map at [bouwmelding.nl](https://bouwmelding.nl/).

## Ways to Contribute

- **Bug reports** -- something broken or displaying incorrectly? Open an issue.
- **Feature requests** -- have an idea to improve the map or data display? Open an issue to discuss it first.
- **Code contributions** -- bug fixes and improvements are welcome via pull request.
- **Data corrections** -- if municipality data in `municipalities.json` or period data in `periods.json` is outdated, a PR is the fastest fix.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended) -- only needed for linting/formatting
- A modern web browser
- A Google Maps API key (domain-restricted) if you want to run the app locally with the map

### Local Setup

1. Fork the repository and clone your fork:

   ```bash
   git clone https://github.com/<your-username>/bekendmakingen.git
   cd bekendmakingen
   ```

2. Install development dependencies:

   ```bash
   npm install
   ```

3. Open `index.html` directly in a browser, or serve it with any static file server:

   ```bash
   npx serve .
   ```

   > **Note:** The Google Maps API key in `index.html` is domain-restricted. The map may not load on `localhost` unless you substitute your own unrestricted key for local development. Do not commit your personal API key.

## Development Workflow

### Code Style

This project uses [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) to enforce consistent style.

Before opening a pull request, run:

```bash
npm run check
```

This runs both the linter and the formatter check. To auto-fix formatting issues:

```bash
npm run format
```

To auto-fix lint issues:

```bash
npm run lint:fix
```

### Making Changes

1. Create a new branch from `main`:

   ```bash
   git checkout -b fix/your-descriptive-branch-name
   ```

2. Make your changes in the relevant files (`map.js`, `index.html`, `map.css`, JSON data files, etc.).

3. Run the quality checks:

   ```bash
   npm run check
   ```

4. Commit your changes with a clear, descriptive message:

   ```bash
   git commit -m "fix: correct marker icon for event permits"
   ```

5. Push your branch and open a pull request against `main`.

## Pull Request Guidelines

- Keep pull requests focused -- one logical change per PR.
- Describe **what** you changed and **why** in the PR description.
- Reference any related issues using `Closes #123` syntax.
- Ensure `npm run check` passes before requesting review.
- PRs that introduce new external dependencies will require discussion first (the project intentionally has zero runtime dependencies).

## Reporting Bugs

Please open a [GitHub issue](https://github.com/basgroot/bekendmakingen/issues) and include:

- A clear description of the problem
- Steps to reproduce
- Expected vs. actual behavior
- Browser and OS version

For **security vulnerabilities**, please follow the [Security Policy](SECURITY.md) instead of opening a public issue.

## Code of Conduct

This project follows a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to abide by its terms.
