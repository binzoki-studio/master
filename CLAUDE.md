# Binzoki Studio — Project Context

## Who I am
Creative studio by Marco Gudini (binzoki-studio on GitHub).
This repo powers the portfolio site at binzoki-studio.github.io/master

## Repo structure
~/Desktop/Claude/github/
├── index.html          # Main portfolio homepage
├── assets/             # Cover images and static assets
├── games/
│   ├── snake/
│   │   └── snake.html      # Snake game (live)
│   ├── asteroids/
│   │   └── asteroids.html  # VOIDRIFT asteroids game (live)
│   └── flappy/
│       └── flappy.html     # FLAPVOID flappy bird game (live)
├── ai/
│   ├── model-arena/        # Model Arena (deployed to Vercel)
│   └── rag-chat/
│       └── index.html      # RAG Chat tool (live, browser-only)
└── CLAUDE.md           # This file

## index.html structure
- Built with vanilla HTML/CSS/JS
- Font: Bebas Neue (display) + DM Sans (body) + Space Mono (mono)
- Color system:
  - Games section:      --games: #ff3c00
  - Pop Culture:        --popculture: #7c3aed
  - Design & Art:       --design: #00b4a0
  - Accent:             --accent: #ffe600
- Project cards use .card class, featured cards use .card.featured
- Placeholder cards use .card.placeholder (greyed out, not clickable)
- Section count displayed in .section-count div in .section-header

## When adding a new game
1. Create folder: `games/<game-name>/`
2. Create: `games/<game-name>/<game-name>.html`
3. Add a .card.featured in index.html under #games section with href `games/<game-name>/<game-name>.html`
4. Update section count in #games .section-count
5. Commit: `git add . && git commit -m "Add <game name>" && git push`

## When adding a new project (non-game)
1. Replace a .card.placeholder in the relevant section
2. Update section count
3. Commit and push

## Design rules for new cards
- Always use a large emoji as the visual on the right side of featured cards
- Tags should reflect the tech/style used
- Badge "Live" = green, "WIP" = yellow, leave empty for placeholders
- Keep descriptions 1-2 sentences, punchy

## Git
- Remote: git@github.com:binzoki-studio/master.git
- Branch: main
- SSH is configured, just run `git push`

## Code style
- Vanilla JS only (no frameworks)
- Canvas API for games
- Single HTML files (CSS + JS inline)
- Google Fonts via CDN
- No build tools, no npm

## Games built so far
- Snake: retro arcade, Press Start 2P font, green neon aesthetic, power-ups, themes, speed settings
- VOIDRIFT (Asteroids): deep space, Orbitron font, cyan neon aesthetic, heat system, wave progression
- FLAPVOID (Flappy Bird): deep space, Orbitron font, yellow/red neon aesthetic, screen shake, particles, persistent best score

## Standing instructions
- Always update CLAUDE.md at the end of every session to reflect any new files, folders, games, or design changes made
- Include the update in the same final commit, not a separate one
- If nothing structural changed, skip the update
