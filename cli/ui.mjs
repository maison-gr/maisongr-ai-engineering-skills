// The CLI's voice: one symbol per kind of line, so a run reads at a glance.
//
//   ✓ done   · nothing to change   ! needs a look   ✗ stopped   → do this next
//
// Colour only on a terminal that shows it: never when piped or in a file,
// never with NO_COLOR, always with FORCE_COLOR. ASCII symbols where the
// console can't draw the others (the old Windows console). No dependencies.

export function styleFor(stream, env = process.env, platform = process.platform) {
  const forced = env.FORCE_COLOR;
  const color = forced !== undefined ? forced !== "0" && forced !== "false" : !env.NO_COLOR && env.TERM !== "dumb" && (Boolean(stream && stream.isTTY) || Boolean(env.GITHUB_ACTIONS));
  const unicode =
    platform !== "win32"
      ? env.TERM !== "linux"
      : Boolean(env.WT_SESSION || env.CI || env.TERM_PROGRAM === "vscode" || env.ConEmuTask || env.TERMINAL_EMULATOR === "JetBrains-JediTerm" || /^(xterm|alacritty)/.test(env.TERM || ""));
  return { color, unicode };
}

const SGR = { bold: [1, 22], dim: [2, 22], red: [31, 39], green: [32, 39], yellow: [33, 39], cyan: [36, 39] };

export function createUi(write, style) {
  const paint = (s, ...names) => (style.color ? names.reduce((out, n) => `\u001b[${SGR[n][0]}m${out}\u001b[${SGR[n][1]}m`, s) : s);
  const mark = style.unicode ? { ok: "✓", same: "·", warn: "!", fail: "✗", next: "→" } : { ok: "+", same: "-", warn: "!", fail: "x", next: ">" };
  let warnings = 0;
  const line = (s = "") => write(`${s}\n`);
  const withNote = (text, note) => (note ? `${text}  ${paint(note, "dim")}` : text);

  return {
    paint,
    line,
    get warnings() {
      return warnings;
    },
    title(version, command) {
      line(`\n  ${paint("maisongr-skills", "bold")} ${paint(`${version} · ${command}`, "dim")}`);
    },
    subject(text, note) {
      line(`\n  ${withNote(paint(text, "bold"), note)}`);
    },
    heading(text, count) {
      line(`\n  ${paint(text, "bold")}${count === undefined ? "" : ` ${paint(String(count), "dim")}`}`);
    },
    ok(text, note) {
      line(`  ${paint(mark.ok, "green")} ${withNote(text, note)}`);
    },
    /** Already as it should be: shown, but quietly. */
    same(text, note) {
      line(`  ${paint(mark.same, "dim")} ${paint(withNote(text, note), "dim")}`);
    },
    warn(text, note) {
      warnings++;
      line(`  ${paint(mark.warn, "yellow", "bold")} ${withNote(text, note)}`);
    },
    next(text, note) {
      line(`  ${paint(mark.next, "cyan")} ${withNote(text, note)}`);
    },
    text(text) {
      line(`    ${text}`);
    },
    code(s) {
      return paint(s, "cyan");
    },
    done(ms, what = "Done") {
      const time = paint(ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`, "dim");
      if (warnings) line(`\n  ${paint(mark.ok, "green")} ${what} ${paint("·", "dim")} ${paint(`${warnings} to look at above`, "yellow")} ${time}\n`);
      else line(`\n  ${paint(mark.ok, "green")} ${paint(what, "bold")} ${time}\n`);
    },
    /** A stop: the first line says what, the rest how to fix it; indented lines are commands. */
    error(message) {
      const [first = "", ...rest] = message.split("\n");
      line(`\n  ${paint(`${mark.fail} ${first}`, "red", "bold")}`);
      for (const r of rest) line(r ? `    ${r.trimStart() === r ? r : paint(r.trim(), "cyan")}` : "");
      line();
    },
  };
}
