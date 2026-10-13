/*
 * The player's ship, shared by the demo and the game so they
 * always look the same. Drawn pointing along `angle` (radians).
 */
export function drawShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number
) {
  ctx.save();

  ctx.translate(x, y);
  ctx.rotate(angle);

  // Engine flame
  ctx.fillStyle = "#fb923c";

  ctx.beginPath();
  ctx.moveTo(-14, -7);
  ctx.lineTo(-31, 0);
  ctx.lineTo(-14, 7);
  ctx.closePath();
  ctx.fill();

  // Ship body
  ctx.fillStyle = "#22d3ee";
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(26, 0);
  ctx.lineTo(-17, -15);
  ctx.lineTo(-9, 0);
  ctx.lineTo(-17, 15);
  ctx.closePath();

  ctx.fill();
  ctx.stroke();

  // Cockpit window
  ctx.fillStyle = "#1e3a8a";

  ctx.beginPath();
  ctx.ellipse(3, 0, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
