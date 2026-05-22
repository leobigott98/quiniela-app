"use client";

import { useState } from "react";

type ShareProps = {
  homeTeam: string;
  awayTeam: string;
  predHome: number;
  predAway: number;
  matchLabel: string;
};

export function SharePredictionButton({ homeTeam, awayTeam, predHome, predAway, matchLabel }: ShareProps) {
  const [status, setStatus] = useState<string | null>(null);

  async function buildImageFile() {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas no disponible");

    const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
    gradient.addColorStop(0, "#121826");
    gradient.addColorStop(1, "#0f172a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.arc(900, 180, 320, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(120, 1700, 380, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f97316";
    ctx.roundRect(120, 150, 840, 90, 45);
    ctx.fill();

    ctx.fillStyle = "#fff7ed";
    ctx.font = "700 38px Arial";
    ctx.textAlign = "center";
    ctx.fillText("QUINIELA ANIVERSARIO", 540, 210);

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 78px Arial";
    wrapText(ctx, "Mi pronóstico", 540, 420, 820, 86);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "400 34px Arial";
    ctx.fillText(matchLabel, 540, 540);

    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.roundRect(100, 690, 880, 520, 42);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 56px Arial";
    wrapText(ctx, homeTeam, 300, 820, 340, 62);
    wrapText(ctx, awayTeam, 780, 820, 340, 62);

    ctx.fillStyle = "#f97316";
    ctx.font = "900 130px Arial";
    ctx.fillText(`${predHome} - ${predAway}`, 540, 1030);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "500 44px Arial";
    wrapText(ctx, "Yo ya jugué. ¿Tú qué marcador pondrías?", 540, 1390, 780, 56);

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 38px Arial";
    ctx.fillText("Comparte tu quiniela", 540, 1680);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error("No se pudo generar la imagen")), "image/png");
    });

    return new File([blob], "mi-pronostico.png", { type: "image/png" });
  }

  async function handleShare() {
    setStatus(null);
    try {
      const file = await buildImageFile();
      const shareData = {
        title: "Mi pronóstico de la quiniela",
        text: `${homeTeam} ${predHome} - ${predAway} ${awayTeam}`,
        files: [file],
      };

      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share(shareData);
        setStatus("Listo para compartir.");
        return;
      }

      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Imagen descargada. Súbela a tus historias.");
    } catch (error) {
      setStatus("No se pudo compartir. Intenta de nuevo.");
    }
  }

  return (
    <div className="share-box">
      <button type="button" className="secondary-button" onClick={handleShare}>Compartir mi pronóstico</button>
      {status && <p className="tiny">{status}</p>}
    </div>
  );
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  for (const word of words) {
    const testLine = `${line}${word} `;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, y);
      line = `${word} `;
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, y);
}
