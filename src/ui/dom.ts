type Child = Node | string | null | undefined | false;

/** Kleiner DOM-Helfer: el('div', { class: 'x' }, 'Text', otherNode). */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, string | number | boolean | EventListener> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'function') {
      node.addEventListener(key.replace(/^on/, '').toLowerCase(), value);
    } else if (typeof value === 'boolean') {
      if (value) node.setAttribute(key, '');
    } else {
      node.setAttribute(key, String(value));
    }
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child);
  }
  return node;
}

/** Text nur setzen, wenn er sich ändert (vermeidet DOM-Arbeit pro Frame). */
export function setText(node: Node, text: string): void {
  if (node.textContent !== text) node.textContent = text;
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
