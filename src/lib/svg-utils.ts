export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function parseViewBox(viewBox: string | undefined, fallbackSize = 24): ViewBox {
  const parts = (viewBox || "").split(/\s+/).map(Number);
  return {
    x: parts[0] || 0,
    y: parts[1] || 0,
    w: parts[2] || fallbackSize,
    h: parts[3] || fallbackSize,
  };
}

// Escapes a value for use inside a double-quoted XML attribute.
export function escapeAttr(value: string): string {
  return value.replace(
    /[&"<>]/g,
    (character) =>
      ({ "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" })[character] || character,
  );
}
