import { test } from "node:test";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";

import { confirm, isInteractive, select } from "../lib/prompt.mjs";

function fakeTty({ interactive = true } = {}) {
  const input = new PassThrough();
  const output = new PassThrough();
  let text = "";
  output.on("data", (chunk) => {
    text += chunk.toString();
  });
  input.isTTY = interactive;
  output.isTTY = interactive;
  input.isRaw = false;
  input.setRawMode = (value) => {
    input.isRaw = Boolean(value);
  };
  return { input, output, text: () => text };
}

const options = [
  { value: "personal", label: "个人" },
  { value: "project", label: "项目" },
];

test("select resolves the highlighted option with arrow keys", async () => {
  const tty = fakeTty();
  const answer = select({ message: "安装范围", options, defaultIndex: 0, input: tty.input, output: tty.output });

  tty.input.emit("data", "\u001b[B");
  tty.input.emit("data", "\r");

  assert.equal(await answer, "project");
  assert.match(tty.text(), /安装范围/);
  assert.equal(tty.input.isRaw, false);
});

test("select supports number keys", async () => {
  const tty = fakeTty();
  const answer = select({ message: "目录结构", options, input: tty.input, output: tty.output });

  tty.input.emit("data", "1");

  assert.equal(await answer, "personal");
});

test("confirm maps to booleans", async () => {
  const tty = fakeTty();
  const answer = confirm({ message: "继续？", input: tty.input, output: tty.output, defaultIndex: 1 });

  tty.input.emit("data", "\r");

  assert.equal(await answer, false);
});

test("ctrl+c rejects with CANCELLED", async () => {
  const tty = fakeTty();
  const answer = select({ message: "取消", options, input: tty.input, output: tty.output });
  answer.catch(() => {});

  tty.input.emit("data", "\u0003");

  await assert.rejects(answer, (error) => error.code === "CANCELLED");
});

test("non-TTY streams are reported as non-interactive", () => {
  const tty = fakeTty({ interactive: false });
  assert.equal(isInteractive({ input: tty.input, output: tty.output }), false);
  assert.rejects(
    select({ message: "x", options, input: tty.input, output: tty.output }),
    /不支持交互/,
  );
});
