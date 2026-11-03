const useColor = process.stdout.isTTY && !process.env.NO_COLOR && process.env.TERM !== "dumb";

function wrap(code) {
  return (text) => (useColor ? `\u001b[${code}m${text}\u001b[0m` : text);
}

export const color = {
  bold: wrap("1"),
  dim: wrap("2"),
  green: wrap("32"),
  yellow: wrap("33"),
  red: wrap("31"),
  cyan: wrap("36"),
};

function displayWidth(text) {
  let width = 0;
  for (const char of text) {
    const code = char.codePointAt(0);
    width +=
      (code >= 0x1100 && code <= 0x115f) ||
      (code >= 0x2e80 && code <= 0xa4cf) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe30 && code <= 0xfe6f) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6)
        ? 2
        : 1;
  }
  return width;
}

function pad(text, width) {
  return text + " ".repeat(Math.max(0, width - displayWidth(text)));
}

export function truncate(text, max) {
  if (displayWidth(text) <= max) return text;
  let result = "";
  let width = 0;
  for (const char of text) {
    const charWidth = displayWidth(char);
    if (width + charWidth > max - 1) break;
    result += char;
    width += charWidth;
  }
  return `${result}…`;
}

export function table(rows, { head = [], maxDescription = 72 } = {}) {
  const widths = [];
  const all = head.length > 0 ? [head, ...rows] : rows;
  for (const row of all) {
    row.forEach((cell, index) => {
      let text = String(cell ?? "");
      if (index === row.length - 1 && maxDescription > 0) text = truncate(text, maxDescription);
      widths[index] = Math.max(widths[index] ?? 0, displayWidth(text));
    });
  }
  const lines = all.map((row) =>
    row
      .map((cell, index) => {
        let text = String(cell ?? "");
        if (index === row.length - 1 && maxDescription > 0) text = truncate(text, maxDescription);
        return index === row.length - 1 ? text : pad(text, widths[index]);
      })
      .join("  ")
      .trimEnd(),
  );
  return lines.join("\n");
}

export function info(message) {
  console.log(message);
}

export function step(symbol, message, tone = "green") {
  console.log(`  ${color[tone](symbol)} ${message}`);
}
