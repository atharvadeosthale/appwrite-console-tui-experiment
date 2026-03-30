import { createTestRenderer } from "@opentui/core/testing";
import { createRoot } from "@opentui/react";
import React from "react";

export async function renderFrame(node: React.ReactNode, width = 160, height = 48) {
  const testSetup = await createTestRenderer({
    width,
    height,
    kittyKeyboard: true,
  });
  const root = createRoot(testSetup.renderer);
  root.render(node);
  await Bun.sleep(60);
  await testSetup.renderOnce();
  await Bun.sleep(20);
  await testSetup.renderOnce();
  const frame = testSetup.captureCharFrame();
  root.unmount();
  testSetup.renderer.destroy();
  return frame;
}
