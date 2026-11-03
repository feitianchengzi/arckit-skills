import * as readline from "node:readline";
import { color, displayWidth, truncate } from "./ui.mjs";

export class PromptUnavailableError extends Error {
  constructor(message = "当前环境不支持交互选择") {
    super(message);
    this.name = "PromptUnavailableError";
  }
}

export function isInteractive({ input = process.stdin, output = process.stdout } = {}) {
  return Boolean(input.isTTY && output.isTTY && typeof input.setRawMode === "function");
}

/**
 * Arrow-key menu. Falls back to nothing: callers decide whether to error or
 * use defaults when stdin/stdout is not a TTY.
 */
export function select({
  message,
  options,
  defaultIndex = 0,
  input = process.stdin,
  output = process.stdout,
  hint = "↑/↓ 选择 · Enter 确认 · Ctrl+C 取消",
}) {
  return new Promise((resolve, reject) => {
    if (!options || options.length === 0) {
      reject(new Error("select() 需要至少一个选项"));
      return;
    }
    if (!isInteractive({ input, output })) {
      reject(new PromptUnavailableError());
      return;
    }

    let active = Math.max(0, Math.min(defaultIndex, options.length - 1));
    let rendered = 0;
    const wasRaw = Boolean(input.isRaw);

    const menuLines = () => {
      const width = Math.max(20, (output.columns ?? 80) - 1);
      const labelWidth = Math.min(
        width - 8,
        Math.max(...options.map((option) => displayWidth(option.label))),
      );
      const descriptionBudget = Math.max(8, width - 6 - labelWidth);

      const lines = [`${color.cyan("?")} ${truncate(`${message} ${hint}`, width - 2)}`];
      options.forEach((option, index) => {
        const selected = index === active;
        const pointer = selected ? color.cyan("❯") : " ";
        const label = selected ? color.bold(option.label) : option.label;
        const description = option.description
          ? `  ${color.dim(truncate(option.description, descriptionBudget))}`
          : "";
        lines.push(`  ${pointer} ${label}${description}`);
      });
      return lines;
    };

    const draw = () => {
      const lines = menuLines();
      output.write(`${lines.join("\n")}\n`);
      rendered = lines.length;
    };

    const clear = () => {
      if (rendered === 0) return;
      readline.moveCursor(output, 0, -rendered);
      readline.clearScreenDown(output);
      rendered = 0;
    };

    const cleanup = () => {
      input.removeListener("data", onData);
      if (typeof input.setRawMode === "function") input.setRawMode(wasRaw);
      input.pause();
      clear();
    };

    const finish = (option) => {
      cleanup();
      output.write(`${color.green("✔")} ${message} ${color.bold(option.label)}\n`);
      resolve(option.value);
    };

    const cancel = () => {
      cleanup();
      output.write(`${color.yellow("✖")} ${message} ${color.dim("已取消")}\n`);
      const error = new Error("已取消");
      error.code = "CANCELLED";
      reject(error);
    };

    const onData = (chunk) => {
      const key = chunk.toString("utf8");
      if (key === "\u0003") {
        cancel();
        return;
      }
      if (key === "\r" || key === "\n") {
        finish(options[active]);
        return;
      }
      if (key === "\u001b[A" || key === "\u001bOA" || key === "k") {
        active = (active - 1 + options.length) % options.length;
        clear();
        draw();
        return;
      }
      if (key === "\u001b[B" || key === "\u001bOB" || key === "j") {
        active = (active + 1) % options.length;
        clear();
        draw();
        return;
      }
      if (/^[1-9]$/.test(key)) {
        const index = Number(key) - 1;
        if (index < options.length) finish(options[index]);
      }
    };

    input.setEncoding("utf8");
    try {
      input.setRawMode(true);
    } catch (error) {
      reject(new PromptUnavailableError(`无法启用终端交互模式：${error.message}`));
      return;
    }
    input.resume();
    draw();
    input.on("data", onData);
  });
}

export async function confirm({
  message,
  defaultIndex = 0,
  input = process.stdin,
  output = process.stdout,
  yesLabel = "是",
  noLabel = "否",
} = {}) {
  return select({
    message,
    options: [
      { value: true, label: yesLabel },
      { value: false, label: noLabel },
    ],
    defaultIndex,
    input,
    output,
  });
}
