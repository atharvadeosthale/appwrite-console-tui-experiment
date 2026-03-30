import fs from "node:fs/promises";
import path from "node:path";
import { createCliRenderer } from "@opentui/core";
import { createTestRenderer } from "@opentui/core/testing";
import { createRoot } from "@opentui/react";
import React from "react";
import { App } from "./app/App";
import { TOKENS } from "./theme/tokens";

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

const headless = process.env.APPWRITE_TUI_HEADLESS === "1";

if (headless) {
  const width = Number(process.env.APPWRITE_TUI_HEADLESS_WIDTH ?? 160);
  const height = Number(process.env.APPWRITE_TUI_HEADLESS_HEIGHT ?? 48);
  const outputPath =
    process.env.APPWRITE_TUI_HEADLESS_FRAME_PATH ??
    path.join(process.cwd(), ".appwrite-console-tui", "frame.txt");

  const testRenderer = await createTestRenderer({
    width,
    height,
    kittyKeyboard: true,
  });

  const root = createRoot(testRenderer.renderer);
  root.render(<App />);

  setTimeout(() => {
    void (async () => {
      await testRenderer.renderOnce();
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, testRenderer.captureCharFrame(), "utf8");
      root.unmount();
      testRenderer.renderer.destroy();
      process.stdout.write(`Headless frame written to ${outputPath}\n`);
      process.exit(0);
    })();
  }, 1_200);
} else {
  const renderer = await createCliRenderer({
    exitOnCtrlC: false,
    useAlternateScreen: readBoolean(process.env.APPWRITE_TUI_ALT_SCREEN, true),
    useMouse: readBoolean(process.env.APPWRITE_TUI_MOUSE, true),
    enableMouseMovement: false,
    useKittyKeyboard: { events: true },
    backgroundColor: TOKENS.canvas,
  });

  const root = createRoot(renderer);
  let shuttingDown = false;
  let interruptToken = 0;
  let interruptResetTimer: ReturnType<typeof setTimeout> | null = null;

  function shutdown(code = 0, error?: unknown) {
    if (shuttingDown) return;
    shuttingDown = true;

    if (interruptResetTimer) {
      clearTimeout(interruptResetTimer);
      interruptResetTimer = null;
    }

    try {
      root.unmount();
    } catch {}

    try {
      renderer.destroy();
    } catch {}

    if (error) {
      process.stderr.write(
        `${error instanceof Error ? error.stack ?? error.message : String(error)}\n`,
      );
      process.exitCode = code || 1;
    } else {
      process.exitCode = code;
    }

    setTimeout(() => process.exit(process.exitCode ?? code), 50).unref();
  }

  process.on("SIGINT", () => {
    interruptToken += 1;

    if (interruptToken >= 2) {
      shutdown(0);
      return;
    }

    if (interruptResetTimer) {
      clearTimeout(interruptResetTimer);
    }

    interruptResetTimer = setTimeout(() => {
      interruptToken = 0;
      interruptResetTimer = null;
    }, 2_000);
    interruptResetTimer.unref();
  });
  process.on("SIGTERM", () => shutdown(0));
  process.on("uncaughtException", (error) => shutdown(1, error));
  process.on("unhandledRejection", (error) => shutdown(1, error));

  root.render(<App />);
}
