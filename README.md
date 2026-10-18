# void-jingle

Play a short jingle and print lyrics after a successful [`void deploy`](https://github.com/void-hq/void) (Void deploy CLI from npm package `void`, voidzero-dev).

## Install

```bash
pnpm add -g void-jingle
# or: npm install -g void-jingle
```

Requires **Node 22+**. The `void` CLI is usually a **project devDependency** (`pnpm add -D void`), not a global install.

## Usage

### Explicit wrapper

```bash
void-jingle deploy [args...]
```

Runs `void deploy` with inherited stdio, forwards the exit code, and on **exit 0** plays audio and prints lyrics (timed if an `.lrc` file is configured). On failure, stays silent unless `playOnFailure` is enabled in config.

**Preview without deploying:**

```bash
void-jingle deploy --dry-run
```

Strips `--dry-run`, does **not** invoke `void`, simulates success (exit 0), and plays the jingle + lyrics. Still respects `CI` and `VOID_JINGLE=0`, but ignores the non-TTY silence rule so you can pipe or script a preview.

**Play only:**

```bash
void-jingle play
```

Plays configured audio and lyrics with no deploy.

### Project script (recommended)

In your app `package.json`:

```json
{
  "devDependencies": {
    "void": "^…",
    "void-jingle": "^0.1.0"
  },
  "scripts": {
    "deploy": "void-jingle deploy"
  }
}
```

Then:

```bash
pnpm deploy
# or: npm run deploy
```

`void-jingle` resolves `void` by walking up from the current directory for `node_modules/.bin/void`, then falls back to `void` on your `PATH`.

`pnpm void deploy` and `npx void deploy` run the `void` binary directly (no jingle) unless you use the script above or the shell hook.

### Transparent shell hook

```bash
void-jingle install
```

Adds a marked block to `~/.zshrc`, `~/.bashrc`, and Fish (`~/.config/fish/functions/void.fish`). The `void` **function** works even when `void` is only installed locally: `void deploy` goes through `void-jingle`; other subcommands run the resolved local or global `void` binary.

```bash
void-jingle uninstall
```

Supports `--dry-run` on install/uninstall. Idempotent.

Reload your shell after install (e.g. `source ~/.zshrc`).

## Configuration

Priority (highest wins):

1. `~/.config/void-jingle/config.json`
2. `package.json` → `"voidJingle"` field
3. Bundled defaults in `assets/`

Example `~/.config/void-jingle/config.json`:

```json
{
  "audio": "/path/to/jingle.wav",
  "lyrics": "/path/to/lyrics.txt",
  "lrc": "/path/to/lyrics.lrc",
  "playOnFailure": false,
  "failureAudio": "/path/to/sad.wav"
}
```

Paths may be absolute or relative to the current working directory when deploy runs.

## Environment

| Variable        | Effect |
|-----------------|--------|
| `CI`            | Disable jingle and lyrics |
| `VOID_JINGLE=0` | Disable jingle and lyrics |
| (no TTY)        | Disable jingle and lyrics (`deploy --dry-run` ignores non-TTY only) |

Playback uses `afplay` (macOS), `paplay` / `aplay` / `ffplay` (Linux), or PowerShell on Windows. Playback failures never fail the deploy.

## Plugin-ready API

```ts
import { onDeploySuccess } from "void-jingle/on-deploy-success";
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
