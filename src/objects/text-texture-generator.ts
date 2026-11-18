import { CanvasTexture, SRGBColorSpace } from '@iwsdk/core';

/**
 * Creates high-DPI canvas texture for labels and cards so they remain crisp
 * under Meta Quest lenses and desktop preview.
 */
export function createLabelTexture(
  title: string,
  badgeText: string,
  badgeColor: string = '#38bdf8'
): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;

  // Background pill
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = badgeColor;
  ctx.lineWidth = 4;
  roundRect(ctx, 8, 8, 496, 144, 28);
  ctx.fill();
  ctx.stroke();

  // Type Badge
  ctx.fillStyle = badgeColor;
  roundRect(ctx, 32, 28, 120, 36, 12);
  ctx.fill();

  ctx.fillStyle = '#090d16';
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText.toUpperCase(), 92, 47);

  // Title text
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // Truncate if too long
  let displayTitle = title;
  if (ctx.measureText(displayTitle).width > 440) {
    while (displayTitle.length > 3 && ctx.measureText(displayTitle + '...').width > 440) {
      displayTitle = displayTitle.slice(0, -1);
    }
    displayTitle += '...';
  }
  ctx.fillText(displayTitle, 32, 105);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * Creates canvas texture for floating glass note cards.
 */
export function createCardTexture(
  title: string,
  content: string,
  zoneName?: string
): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 360;
  const ctx = canvas.getContext('2d')!;

  // Frosted Card Body
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.lineWidth = 4;
  roundRect(ctx, 8, 8, 496, 344, 24);
  ctx.fill();
  ctx.stroke();

  // Top header line: Note badge & zone
  ctx.fillStyle = '#c084fc';
  roundRect(ctx, 28, 28, 80, 32, 8);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NOTE', 68, 45);

  if (zoneName) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(zoneName.toUpperCase(), 480, 45);
  }

  // Divider
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(28, 76);
  ctx.lineTo(484, 76);
  ctx.stroke();

  // Title
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  let displayTitle = title;
  if (ctx.measureText(displayTitle).width > 440) {
    displayTitle = displayTitle.slice(0, 24) + '...';
  }
  ctx.fillText(displayTitle, 28, 92);

  // Body content (multi-line wrapping)
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  wrapText(ctx, content, 28, 140, 450, 32, 5);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const words = text.split(' ');
  let line = '';
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
      line = words[n] + ' ';
      lineCount++;
      if (lineCount >= maxLines - 1 && n < words.length - 1) {
        ctx.fillText(line.trim() + '...', x, y + lineCount * lineHeight);
        return;
      }
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y + lineCount * lineHeight);
}
