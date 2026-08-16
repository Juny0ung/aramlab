# AramLab

A backend API server that automatically collects and stores League of Legends match history (ARAM and normal queues) and exposes per-user stats and match data. It periodically syncs match data from the Riot Games API into MongoDB, using a queue and cache layer to keep repeated lookups fast.

## Features

- **Summoner registration & lookup**: Resolve a Riot account by nickname#tag and register/look up users by `puuid`
- **Match data sync**: Fetch match ID lists and detailed match data (per-participant KDA, gold, damage, items, runes, team/objective info, etc.) from the Riot API and persist it to MongoDB
- **Automated scheduling**: A BullMQ-based scheduler enqueues new matches for all registered users every hour (cron `0 0 * * * *`) and processes them asynchronously
- **Riot API rate-limit handling**: Custom retry/backoff logic for 429 responses to survive large sync batches
- **Caching**: Redis caches frequently requested match/stat lookups and is invalidated once queue jobs complete
- **Queue monitoring**: Bull Board dashboard (`/admin/queues`) for real-time job status

## Tech Stack

- **Framework**: NestJS 11 (Express), TypeScript
- **Database**: MongoDB (Mongoose)
- **Queue / Scheduler**: BullMQ, Redis
- **HTTP Client**: Axios (`@nestjs/axios`)
- **Config Validation**: Joi

## Architecture

- Ports/adapters (hexagonal-style) design — interfaces like `UsersPort` and `LolDataSyncPort` decouple domain logic from external integrations (Riot API, database)
- Match sync uses an Enqueuer/Processor split (BullMQ producer + worker) so large data collection runs in the background without blocking API responses
- DTOs separate Riot API response shapes from internal domain models

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/users` | Register a summoner |
| GET | `/users/:name` | Get a user |
| GET | `/users` | List all users |
| GET | `/lol-data-sync/puuid/:nickname/:tag` | Resolve a Riot account's puuid |
| POST | `/lol-data/updateloldata/:queue/:name?` | Sync latest data for a user (or all users) |
| POST | `/lol-data/updatematches/:queue/:name?` | Sync match data |
| GET | `/lol-data/loldata/:queue/:name` | Get a user's stat summary |
| GET | `/lol-data/matches/:queue/:name` | Get a user's match list |

## Getting Started

```bash
$ npm install

# start Redis (requires docker compose)
$ npm run redis::up

# development mode
$ npm run start:dev
```

### Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string (required) |
| `LOL_API_KEY` | Riot Games API key (required) |
| `REDIS_HOST` / `REDIS_PORT` | Redis connection info |
| `PORT` | Server port |
