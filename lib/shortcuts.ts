interface ShortcutEvent {
  code: string;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  repeat: boolean;
}
/** Avoid Ctrl+number, which browsers reserve for switching tabs. */
export function abilityShortcut(event: ShortcutEvent): number | null {
  const modifier =
    (event.altKey && !event.ctrlKey && !event.metaKey) ||
    (event.ctrlKey && event.shiftKey && !event.altKey && !event.metaKey);
  const digit = /^(?:Digit|Numpad)([1-5])$/.exec(event.code)?.[1];
  return modifier && digit && !event.repeat ? Number(digit) : null;
}
