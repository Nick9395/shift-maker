const cursorCache = new Map<string, string>();

const FALLBACK_COLOR = "#4a4038";

/** 消しゴムツールのカーソル画像 */
export function eraserCursor(): string {
  const cached = cursorCache.get("eraser");
  if (cached) return cached;

  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "cell";

  ctx.translate(6, 18);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = "#e8a0b0";
  ctx.strokeStyle = "#5c534a";
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.roundRect(-7, -5, 18, 10, 1.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f7efe4";
  ctx.fillRect(5, -5, 6, 10);
  ctx.strokeRect(5, -5, 6, 10);

  const value = `url("${canvas.toDataURL("image/png")}") 6 22, cell`;
  cursorCache.set("eraser", value);
  return value;
}

/** 選択中シフト種別の色ドットをカーソル画像にする */
export function brushCursor(color: string | undefined): string {
  const hex =
    color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : FALLBACK_COLOR;
  const cached = cursorCache.get(hex);
  if (cached) return cached;

  const size = 32;
  const hotspot = 8;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "crosshair";

  ctx.beginPath();
  ctx.arc(hotspot, hotspot, 6, 0, Math.PI * 2);
  ctx.fillStyle = hex;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  const value = `url("${canvas.toDataURL("image/png")}") ${hotspot} ${hotspot}, crosshair`;
  cursorCache.set(hex, value);
  return value;
}
