# into-the-void

Play a short jingle and print **into the void** after a successful [`void deploy`](https://github.com/void-hq/void) (Void deploy CLI from npm package `void`, voidzero-dev).

## Install

```bash
pnpm add -D into-the-void
```

Requires **Node 22+**. The `void` CLI is usually a **project devDependency** (`pnpm add -D void`), not a global install.

Try the jingle without deploying:

```bash
npx into-the-void play
```

## Usage

### Project script (recommended)

```json
{
  "devDependencies": {
    "void": "^…",
    "into-the-void": "^0.1.0"
  },
  "scripts": {
    "deploy": "into-the-void deploy"
  }
}
```

```bash
pnpm deploy
```

### Explicit CLI

```bash
into-the-void deploy [args...]
```

Runs `void deploy` with inherited stdio, forwards the exit code, and on **exit 0** plays the jingle and prints a styled `into the void` line once (plain text when `NO_COLOR` is set or stdout is not a TTY).

**Preview without deploying:**

```bash
into-the-void deploy --dry-run
```

**Play only:**

```bash
into-the-void play
```

`into-the-void` resolves `void` by walking up from the current directory for `node_modules/.bin/void`, then falls back to `void` on your `PATH`.

`pnpm void deploy` and `npx void deploy` run the `void` binary directly (no jingle) unless you use the script above or the shell hook.

The `void-jingle` command name is a deprecated alias for the same CLI.

### Transparent shell hook

```bash
into-the-void install
```

Adds a marked block to `~/.zshrc`, `~/.bashrc`, and Fish (`~/.config/fish/functions/void.fish`). Migrates away from legacy `void-jingle` install blocks. `void deploy` goes through `into-the-void`; other subcommands use the resolved local or global `void` binary.

```bash
into-the-void uninstall
```

Removes current and legacy install blocks. Supports `--dry-run`. Idempotent.

## Configuration

Priority (highest wins):

1. `~/.config/into-the-void/config.json` (legacy: `~/.config/void-jingle/config.json`)
2. `package.json` → `"intoTheVoid"` (legacy: `"voidJingle"`)
3. Bundled default jingle in `assets/default.wav`

Example `~/.config/into-the-void/config.json`:

```json
{
  "audio": "/path/to/jingle.wav",
  "playOnFailure": false,
  "failureAudio": "/path/to/sad.wav"
}
```

## Environment

| Variable | Effect |
|----------|--------|
| `CI` | Disable jingle and tagline |
| `INTO_THE_VOID=0` | Disable jingle and tagline |
| `VOID_JINGLE=0` | Same as `INTO_THE_VOID=0` (legacy) |
| `NO_COLOR` | Plain `into the void` text (no ANSI styling) |
| (no TTY) | Plain text; no jingle (`deploy --dry-run` ignores non-TTY only) |

## Plugin-ready API

```ts
import { onDeploySuccess } from "into-the-void/on-deploy-success";
```

## Development

```bash
pnpm install
pnpm test
pnpm build
pnpm lint
```

## License

MIT © froQ
