# void-jingle

Play a short jingle and print lyrics after a successful [`void deploy`](https://github.com/void-hq/void) (Void deploy CLI).

## Install

```bash
pnpm add -g void-jingle
# or: npm install -g void-jingle
```

Requires **Node 22+** and the `void` CLI on your `PATH`.

## Usage

### Explicit wrapper

Run deploy through void-jingle directly:

```bash
void-jingle deploy [args...]
```

This spawns `void deploy ...` with inherited stdio, forwards the exit code, and on **exit 0** plays audio and prints lyrics (timed if an `.lrc` file is configured, otherwise plain text). On failure, stays silent unless `playOnFailure` is enabled in config.

### Transparent shell hook

Install a shell function so your normal `void deploy` flow is wrapped automatically:

```bash
void-jingle install
```

This adds a clearly marked block to `~/.zshrc`, `~/.bashrc`, and Fish (`~/.config/fish/functions/void.fish`). The `void` function routes `void deploy` through `void-jingle` and passes all other subcommands to the real binary (`command void`).

Remove the block:

```bash
void-jingle uninstall
```

Both commands support `--dry-run` (print what would change without writing files). Install/uninstall are idempotent.

Reload your shell after install (e.g. `source ~/.zshrc`).

## Configuration

Priority (highest wins):

1. `~/.config/void-jingle/config.json`
2. `package.json` → `"voidJingle"` field in the project directory
3. Bundled placeholders in `assets/` (silent WAV + sample lyrics)

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

Example `package.json`:

```json
{
  "voidJingle": {
    "audio": "./deploy-success.wav"
  }
}
```

Paths may be absolute or relative to the current working directory when deploy runs.

## Environment

| Variable        | Effect                                      |
|-----------------|---------------------------------------------|
| `CI`            | Disable jingle and lyrics (any value)       |
| `VOID_JINGLE=0` | Disable jingle and lyrics                   |
| (no TTY)        | Disable jingle and lyrics                   |

Playback uses `afplay` (macOS), `paplay` / `aplay` / `ffplay` (Linux), or PowerShell on Windows. Playback failures never fail the deploy.

## Plugin-ready API

The success hook lives in a separate module for future Void post-deploy plugins:

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
