# Claude Image View (iTerm2 fork)

Fork of [jarrodwatts/claude-image-view](https://github.com/jarrodwatts/claude-image-view) that adds real pictures in iTerm2 3.6+ (see [iTerm2](#iterm2)). Everything else is upstream.

A Claude Code mod that shows the images you paste, so you see thumbnails above your prompt instead of bare `[Image #1]` tags.

[![License](https://img.shields.io/github/license/jarrodwatts/claude-image-view?v=2)](LICENSE)
[![Stars](https://img.shields.io/github/stars/jarrodwatts/claude-image-view)](https://github.com/jarrodwatts/claude-image-view/stargazers)

![Claude Image View in action](claude-image-view.png)

## Install

Inside Claude Code, run:

```
/plugin marketplace add JasonWang1124/claude-image-view
/plugin install image-view@claude-image-view
/reload-plugins
```

That's it. Paste an image into the prompt and its thumbnail appears above the input.

<details>
<summary><strong>Prefer the terminal?</strong></summary>

```bash
claude plugin marketplace add JasonWang1124/claude-image-view
claude plugin install image-view@claude-image-view
```

Then run `/reload-plugins` inside a session, or start a new one.

</details>

## What You See

Paste one or more images and a row of thumbnails sits above the prompt, each labelled with the number of its tag:

```
╭────────────────────────╮ ╭────────────╮
│                        │ │            │
│      (screenshot)      │ │  (photo)   │
│                        │ │            │
│           #1           │ │     #2     │
╰────────────────────────╯ ╰────────────╯
❯ why is the header misaligned here [Image #1] vs [Image #2]
```

- **Thumbnails appear as soon as you paste.** You don't have to type another key first.
- **Thumbnails keep their shape.** Wide screenshots stay wide and phone shots stay tall.
- **Always fits on screen.** Tiles shrink to fit the space above the prompt, so the row never scrolls or gets cut off. If there are too many, the row ends with `+N` for the rest.
- **Clears on send.** Once the prompt is sent (or the tags are deleted), the row goes away.

## How It Works

Claude Code saves every pasted image to a cache folder for the session, as `<tmp>/<project>/<session>/images/<n>.<ext>` in the format it was pasted (`.png`, `.webp`, `.jpg`, ...), and puts an `[Image #n]` tag in the prompt. Claude Image View is a [mod](https://code.claude.com/docs/en/plugins/mods/overview):

1. Every 200ms it reads the prompt box and looks for `[Image #n]` tags. It checks on a timer because pasting an image doesn't raise an edit event.
2. For each tag it finds the cached file. Kitty graphics only draws PNG from a file, so on macOS anything else (WebP, JPEG, HEIC, GIF, TIFF) is converted once with `sips` to `<session>/image-view-<n>.png`. It reads the size from the PNG header.
3. It draws the thumbnails in the band above the prompt. Where Claude Code draws pictures (see [Terminal Support](#terminal-support)) it uses Claude Code's `Image` element, and the terminal reads the file itself, so the image data never passes through the mod.
4. Anywhere else it decodes the PNG itself, averages it down to a small thumbnail, and draws it in colored half blocks (`▀`) with Claude Code's `Raster` element. It's lower resolution than a real picture, but it's the picture.

## Terminal Support

Claude Code, not the mod, decides whether a terminal gets real pictures. It draws them in kitty (0.28+) and Ghostty, and turns them off inside tmux and screen and in background sessions. Every other terminal gets half-block thumbnails.

| Terminal | Thumbnail |
|---|---|
| Ghostty, kitty | Real picture |
| iTerm2 3.6+ | Real picture, after a one-time **Enable** (below) |
| Terminal.app, WezTerm, VS Code, Windows Terminal, Orca, most others | Half blocks |
| Inside tmux or screen, even in Ghostty or kitty | Half blocks |
| Agent view and background sessions | Half blocks, or real pictures with `CLAUDE_CODE_FORCE_TERMINAL_IMAGES` (below) |

Some terminals speak the kitty graphics protocol but still get half blocks, because Claude Code trusts terminals by name ([anthropics/claude-code#99566](https://github.com/anthropics/claude-code/issues/99566)), or because it doesn't wrap images for tmux passthrough yet ([anthropics/claude-code#100146](https://github.com/anthropics/claude-code/issues/100146)). Those are Claude Code limits, so a fix there brings real pictures to the mod with no change here.

### iTerm2

iTerm2 3.6 and later speaks the kitty graphics protocol, Unicode placeholders included: it answers the protocol's query (`a=q`) with `OK` for file and direct PNG transmission and for placeholder placement, and it draws Claude Code's pictures correctly once Claude Code is told to send them (verified on iTerm2 3.7.6 with Claude Code 2.1.292, whose own log says `kittyGraphics=no (probe: graphics reply OK, terminal iTerm2 3.7.6)`: the probe passes, the name check fails).

So in iTerm2 3.6+ this fork doesn't draw half blocks. The first time you paste an image it offers to turn pictures on:

```
╭──────────────────────────────────────────────────────────────────────────╮
│ [Image #1] pasted. iTerm2 3.7.6 can draw it as a real picture, but        │
│ Claude Code only sends pictures to terminals it knows by name.            │
│ 1: Enable real pictures in iTerm2    0: Not now                           │
╰──────────────────────────────────────────────────────────────────────────╯
```

**Enable** writes `"env": { "CLAUDE_CODE_FORCE_TERMINAL_IMAGES": "1" }` into `~/.claude/settings.json` (the previous file is kept as `settings.json.image-view.bak`). Restart Claude Code and pasted images show as real pictures, the same as in Ghostty. Nothing else changes: inside tmux or screen Claude Code still turns images off, and `CLAUDE_IMAGE_VIEW_RENDERER=blocks` still forces half blocks if you prefer them.

#### iTerm2 使用者（繁體中文）

iTerm2 3.6 以上已支援 kitty 圖形協定（含 Unicode placeholder），只是 Claude Code 認終端名稱不認能力，預設不對 iTerm2 送圖。在 iTerm2 貼圖時，這個版本會在輸入框上方顯示「Enable real pictures in iTerm2」按鈕（按 `1`），按下後會把 `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1` 寫進 `~/.claude/settings.json` 的 `env` 區塊（舊檔備份為 `settings.json.image-view.bak`），**重新啟動 Claude Code** 後貼上的圖就是真實圖片，不是色塊。

`CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1` makes Claude Code draw pictures in any terminal. Only set it if your terminal supports the kitty protocol's Unicode placeholders. VS Code's terminal, for one, doesn't yet, and shows a grid of colored squares instead ([xtermjs/xterm.js#5711](https://github.com/xtermjs/xterm.js/issues/5711)).

## Security

Claude Image View is local-only. It makes no network requests. It reads the prompt box, lists Claude Code's temp folder to find the current session's image cache, and reads each pasted image (up to Claude Code's 4 MiB read limit). For a non-PNG paste it runs `sips` and writes one PNG thumbnail into that session's temp folder. On macOS and Linux it runs `id -u` once to find that temp folder. It also reads a few terminal variables (`TERM`, `TERM_PROGRAM`, `TMUX` and similar) to tell which kind of thumbnail Claude Code can draw.

Run `claude plugin validate` on the repo to see every event it hooks and every call it makes.

## Requirements

- Claude Code v2.1.287 or later (mods support)
- macOS or Linux. Windows finds pastes too, but it's less tested and only previews PNG pastes.
- For full-resolution thumbnails, [Ghostty](https://ghostty.org), [kitty](https://sw.kovidgoyal.net/kitty/), or [iTerm2](https://iterm2.com) 3.6+ after the one-time **Enable** (see [Terminal Support](#terminal-support)). Any other terminal gets half-block thumbnails (best with truecolor).

The Claude Desktop app already previews pasted images, so the mod draws nothing there.

## Troubleshooting

**Nothing appears when I paste.** Run `/plugin` and check the dim line under the tabs lists `image-view` as an active mod. If it isn't listed, run `/reload-plugins`. If it still isn't, look for an `image-view: hooks module did not load` line above the first prompt of a new session: that means your Claude Code is too old for the mod, so update it.

**The tile says "no preview".** The mod couldn't find the cached file, or the paste isn't a PNG and you're not on macOS, where `sips` converts it. Claude Code may have moved where it stores pasted images. Please [open an issue](https://github.com/jarrodwatts/claude-image-view/issues) with your Claude Code version.

**The tile is blocky.** Claude Code doesn't draw pictures in your terminal, so the mod draws the picture in colored half blocks. See [Terminal Support](#terminal-support). In iTerm2 3.6+ you should see the **Enable** offer instead; if you dismissed it, add the `env` line from [iTerm2](#iterm2) to `~/.claude/settings.json` by hand.

**The tile shows `[Image #1]` text instead of the picture.** The mod expected Claude Code to draw a picture, but it didn't. That happens in terminals that look like Ghostty or kitty but aren't, such as Herdr ([anthropics/claude-code#101306](https://github.com/anthropics/claude-code/issues/101306)), or in kitty older than 0.28. Set `CLAUDE_IMAGE_VIEW_RENDERER=blocks` in the environment you start Claude Code from. `CLAUDE_IMAGE_VIEW_RENDERER=image` forces real pictures the other way.

**The tile is a grid of colored squares.** `CLAUDE_CODE_FORCE_TERMINAL_IMAGES` is set in a terminal that can't draw Unicode placeholders, such as VS Code's. Unset it to get half-block thumbnails.

**I want real pictures in agent view or a background session.** Claude Code turns terminal images off there. If you attach from Ghostty or kitty, turn them back on in the `env` block of `~/.claude/settings.json`, then start a new session:

```json
"env": { "CLAUDE_CODE_FORCE_TERMINAL_IMAGES": "1" }
```

## Development

```bash
git clone https://github.com/jarrodwatts/claude-image-view
cd claude-image-view

# Load it for one session without installing
claude --plugin-dir .

# Check it and run the tests
claude plugin validate .
claude plugin test .
```

Claude Code writes the API types into `.claude-plugin/types/` the first time it loads the mod, and `tsc -p .` type-checks it from then on.

## License

MIT. See [LICENSE](LICENSE).

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=jarrodwatts/claude-image-view&type=Date)](https://star-history.com/#jarrodwatts/claude-image-view&Date)
