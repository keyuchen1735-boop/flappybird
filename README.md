# flappybird

A small canvas Flappy Bird. Blue pipes, gravity, flapping, scoring.

## Run locally

It is a static site — no build step, no dependencies.

```bash
npx serve .          # or: python3 -m http.server 8000
```

Then open the printed URL.

## Known bug

**Pipe collisions are not detected.** The bird flies straight through every
pipe; only the ground and the ceiling end the game. The cause is the
horizontal overlap test in `hitsPipe()` in `game.js`, which asks for the bird
to be past the pipe's right edge *and* before its left edge at the same time —
impossible, so the function always returns `false` and the gap check beneath it
never runs.

## Deploy to Vercel

Anyone with access to this repo can deploy it; `vercel.json` already configures
it as a zero-build static site serving the repo root.

### Option A — Git integration (recommended for the team)

1. Go to <https://vercel.com/new> and import this Git repository.
2. Leave the framework preset as **Other** and the build settings empty —
   `vercel.json` handles it.
3. Deploy. After that, every push to `main` ships to production automatically
   and every other branch or PR gets its own preview URL.

Once the project is linked, Eric and Kenneth don't need any local setup: they
just push.

### Option B — Vercel CLI

```bash
npm i -g vercel          # or use npx vercel
vercel login
vercel link              # first time only, pick/create the project
vercel                   # preview deploy
vercel --prod            # production deploy
```

`vercel link` writes a `.vercel/` directory, which is gitignored on purpose —
each person links their own checkout to the same project.
