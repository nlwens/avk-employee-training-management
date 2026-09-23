# AVK Employees Training Management

A full-stack training management system for managing employee training programs and development. Built with a monorepo architecture using TypeScript, Node.js, and Docker.

## Table of Contents

- [AVK Employees Training Management](#avk-employees-training-management)
  - [Table of Contents](#table-of-contents)
  - [Project Structure](#project-structure)
  - [Requirements](#requirements)
  - [Getting Started](#getting-started)
    - [Install Dependencies](#install-dependencies)
    - [Local Development](#local-development)
    - [Production-like Setup](#production-like-setup)
    - [Validate Docker Configuration](#validate-docker-configuration)
  - [Available Scripts](#available-scripts)
  - [Docker Setup](#docker-setup)
    - [Files](#files)
    - [Environment Variables](#environment-variables)
    - [Local Development Setup](#local-development-setup)
    - [Production Docker Setup](#production-docker-setup)
    - [Compose File Responsibilities](#compose-file-responsibilities)
      - [`docker-compose.yml` (Base)](#docker-composeyml-base)
      - [`docker-compose.production.yml` (Override)](#docker-composeproductionyml-override)
      - [`docker-compose.development.yml` (Override)](#docker-composedevelopmentyml-override)
    - [Important Notes](#important-notes)

## Project Structure

This is a monorepo managed with Turbo and npm workspaces:

```
avk-employees-training-management/
├── apps/                 # Applications
│   ├── client-app/       # Main client application
│   ├── client-dashboard/ # Dashboard application
│   └── server/           # Node.js backend API
├── packages/             # Shared packages
├── docker-compose.yml    # Local development Docker setup
└── docker-compose.development.yml  # Development Docker setup
└── docker-compose.production.yml  # Production Docker setup
```

## Requirements

- **Node.js**: 24 or higher
- **npm**: 11.0.0 or higher
- **Docker**: For running containerized services

## Getting Started

### Install Dependencies

```bash
npm install
```

### Local Development

For local development, run the database in Docker and the application on your machine:

```bash
# Start the PostgreSQL database in Docker
npm run docker:dev

# In another terminal, run the development server
npm run dev
```

The server will connect to the database running on `localhost:5433`.

**Stop the database:**

```bash
npm run docker:dev:down
```

### Production-like Setup

To test the full application in Docker (both server and database):

```bash
npm run docker:prod
```

This starts both the database and server containers. The server will connect to the database through Docker networking.

**Stop the production setup:**

```bash
npm run docker:prod:down
```

### Validate Docker Configuration

Inspect the final merged Docker Compose configuration:

```bash
npm run docker:prod:validate
```

## Available Scripts

- **`npm run build`** - Build all applications and packages
- **`npm run dev`** - Start development servers
- **`npm run lint`** - Run linting across all packages
- **`npm run test`** - Run unit tests
- **`npm run format`** - Format code with Prettier
- **`npm run test:e2e`** - Run end-to-end tests
- **`npm run test:e2e:ui`** - Run E2E tests with UI
- **`npm run test:component`** - Run component tests
- **`npm run test:component:coverage`** - Run component tests with coverage

## Docker Setup

This project uses Docker Compose for managing containerized services. Three Compose files are provided:

### Files

```txt
docker-compose.yml                    # Base: starts only PostgreSQL
docker-compose.production.yml         # Override: adds server container
docker-compose.development.yml        # Override: adds MailDev container
```

### Environment Variables

The server environment is stored in `apps/server/.env`. Docker Compose reads environment variables from this file using:

```bash
--env-file apps/server/.env
```

### Local Development Setup

For local development, Docker only starts a database and a MailDev container:

```bash
npm run docker:dev
```

In this setup:

- Server runs on your machine (see [server README](apps/server/README.md) for more details)
- Database runs in Docker on `localhost:5433`
- MailDev web UI runs on `localhost:1080`

The local server uses these values from `.env`:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5433
```

### Production Docker Setup

For a production-like setup, Docker Compose starts both the database and the server container:

```bash
npm run docker:prod
```

In this setup:

- Server runs in Docker
- Database runs in Docker
- Server connects to `db:5432`

The production override intentionally sets:

```yaml
DATABASE_HOST: db
DATABASE_PORT: 5432
```

This is required because containers communicate through Docker Compose service names. The database service is named `db`, and PostgreSQL listens on port `5432` inside the Docker network.

### Compose File Responsibilities

#### `docker-compose.yml` (Base)

Base Compose file for local development. It defines only the database service to support local development workflows.

#### `docker-compose.production.yml` (Override)

Production override. It adds the server container and overrides the database connection values required for Docker networking.

#### `docker-compose.development.yml` (Override)

Development override. It adds the MailDev container for local email testing.

### Important Notes

- Do not run `docker-compose.production.yml` by itself
- The production file is an override and depends on the base `docker-compose.yml`
- The development file is an override and depends on the base `docker-compose.yml`
- Always use the commands from `package.json` scripts for Docker operations
- Reference environment variables from `apps/server/.env` in Compose files instead of hardcoding values
