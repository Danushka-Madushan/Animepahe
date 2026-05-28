# Anime Telegram Bot

A Telegram bot that allows users to search for anime and download episodes directly through Telegram.

## Features

- 🔍 Search for anime by title
- 📺 Browse episodes with pagination (15 episodes per page)
- ⬅️➡️ Navigate between pages with Previous/Next buttons
- 📥 Download individual episodes with quality options
- 📦 Download all episodes at once (sends each episode individually, not as ZIP)
- 🎬 Decodes download links using the same logic as the web version

## Setup

### Prerequisites

- Node.js 18+ installed
- A Telegram Bot Token (get from [@BotFather](https://t.me/BotFather))
- Access to the worker API

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
export BOT_TOKEN="your-telegram-bot-token"
export WORKER_URL="https://anime.apex-cloud.workers.dev"  # Optional, defaults to this URL
```

Or create a `.env` file:
```
BOT_TOKEN=your-telegram-bot-token
WORKER_URL=https://anime.apex-cloud.workers.dev
```

3. Build the project:
```bash
npm run build
```

4. Start the bot:
```bash
npm start
```

Or run in development mode:
```bash
npm run dev
```

## Usage

1. Start the bot by sending `/start`
2. Search for anime: `/search Naruto`
3. Click on an anime from the search results
4. Browse episodes or click "Download All"
5. Click on an episode to get download links
6. Click on a quality option to download

## Commands

- `/start` - Start the bot and see welcome message
- `/search <query>` - Search for anime
- `/help` - Show help message

## How It Works

1. **Search**: User sends `/search <query>`, bot calls the worker API search endpoint
2. **Browse**: User clicks an anime, bot fetches episode list (15 per page)
3. **Pagination**: If more than 15 episodes, "Next" button appears
4. **Individual Download**: User clicks episode, bot decodes links and shows quality options
5. **Bulk Download**: User clicks "Download All", bot fetches all episodes and sends each one individually with download links

## Architecture

The bot uses:
- **Telegraf**: Telegram bot framework
- **Axios**: HTTP client for API calls
- **Worker API**: Reuses the existing worker endpoints for search, series, and episode data
- **Link Decoding**: Uses the same decoding logic from `worker/src/reqeusts.ts` via the worker API

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BOT_TOKEN` | Yes | - | Telegram Bot Token from @BotFather |
| `WORKER_URL` | No | `https://anime.apex-cloud.workers.dev` | Worker API URL |

## Development

```bash
# Install dependencies
npm install

# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## License

MIT
