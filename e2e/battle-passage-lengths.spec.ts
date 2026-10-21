import { expect, test } from "@playwright/test";

for (const difficulty of ["easy", "normal"] as const)
  for (const width of [1280, 390]) {
    test(`${difficulty} attack prompts stay short and playable at ${width}px`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/battle");
      await page.getByLabel("OPPONENT DIFFICULTY").selectOption(difficulty);
      await page.getByRole("button", { name: /Solar Knight/ }).click();
      await page.getByRole("button", { name: /Pirate Brawler/ }).click();
      const input = page.getByTestId("typing-input"),
        passage = page.getByTestId("passage");
      await expect(input).toBeEnabled({ timeout: 15000 });
      const buttons = page.locator(".ability-button");
      for (let i = 0; i < 6 && (await buttons.nth(4).isDisabled()); i++) {
        const text = await passage.innerText();
        await input.focus();
        await page.keyboard.type(text, { delay: 2 });
        await expect(passage).not.toHaveText(text);
        await expect(input).toBeEnabled();
      }
      await expect(buttons.nth(4)).toBeEnabled();
      const seen = new Set<string>();
      for (let slot = 0; slot < 5; slot++) {
        await buttons.nth(slot).click();
        await expect(buttons.nth(slot)).toHaveClass(/active/);
        const text = await passage.innerText();
        expect(seen.has(text)).toBe(false);
        seen.add(text);
        expect(text.length).toBeLessThanOrEqual(
          difficulty === "easy" ? (slot === 4 ? 64 : 48) : slot === 4 ? 190 : 180,
        );
        if (difficulty === "easy") {
          const occupied = await passage.evaluate((node) => {
            const rows = new Map<number, { left: number; right: number }>();
            for (const span of node.querySelectorAll("span"))
              for (const rect of span.getClientRects()) {
                const top = Math.round(rect.top),
                  row = rows.get(top);
                rows.set(top, {
                  left: Math.min(row?.left ?? rect.left, rect.left),
                  right: Math.max(row?.right ?? rect.right, rect.right),
                });
              }
            const lines = [...rows.entries()].sort((a, b) => a[0] - b[0]);
            const last = lines.at(-1)![1];
            return lines.length - 1 + (last.right - last.left) / node.clientWidth;
          });
          expect(occupied).toBeLessThanOrEqual(slot === 4 ? 2.5 : 2.05);
        }
        if (slot === 4)
          await page.screenshot({
            path: `.local/passages/${difficulty}-${width}-finisher.png`,
            fullPage: true,
          });
      }
      // Attack selection, pause, and completion still use the actual new prompt.
      await page.getByRole("button", { name: "Pause game" }).click();
      await page.getByRole("button", { name: "Resume game" }).click();
      await expect(passage).toHaveText([...seen].at(-1)!);
      await input.focus();
      await page.keyboard.type(await passage.innerText(), { delay: 2 });
      await expect(page.locator(".hud-hint")).toContainText("Daybreak Ascension unleashed");
      expect(errors).toEqual([]);
    });
  }
