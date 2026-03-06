# Twitch Top Games 🎮

A web app that displays the top live streams on Twitch, sorted by current viewers. Built with vanilla HTML, CSS, and JavaScript.

![Twitch Top Games](https://img.shields.io/badge/Twitch-API-9146FF?style=flat&logo=twitch)

## Features

- 🎯 Browse top 5 trending game categories from Twitch
- 📺 View top 20 live streams per category with thumbnails, streamer avatars, and titles
- ♾️ Infinite scroll to load more streams automatically
- 🎬 Click any stream to watch it live via embedded Twitch player
- 📱 Responsive design for mobile and desktop

## Tech Stack

- HTML / CSS / Vanilla JavaScript
- Twitch Helix API
- Twitch Embed SDK
- IntersectionObserver API (infinite scroll)

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/你的帳號/你的repo名稱.git
cd 你的repo名稱
```

### 2. Set up config

Copy the example config and fill in your Twitch credentials:

```bash
cp config.example.js config.js
```

Edit `config.js`:

```js
const CONFIG = {
  TWITCH_TOKEN: 'Bearer YOUR_TOKEN_HERE',
  TWITCH_CLIENT_ID: 'YOUR_CLIENT_ID_HERE'
}
```

You can get your credentials from the [Twitch Developer Console](https://dev.twitch.tv/console).

### 3. Run locally

```bash
npx serve .
```

Open your browser at `http://localhost:3000`

## Token Renewal

Twitch access tokens expire after 60 days. On the server, a cron job runs daily to automatically renew the token using `renew-token.sh`.

```bash
# runs every day at 3am
0 3 * * * /bin/bash /path/to/renew-token.sh
```

## Deployment

This project uses GitHub Actions to automatically deploy to an AWS EC2 instance on every push to `main`. Sensitive credentials are stored only on the server and never committed to the repository.