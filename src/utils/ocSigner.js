// src/utils/ocSigner.js
import { PDFDocument } from "pdf-lib";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker?url";

GlobalWorkerOptions.workerSrc = pdfWorker;

function normalizeText(s) {
  return (s || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function toU8Copy(data) {
  if (!data) throw new Error("PDF vacío");
  if (data instanceof Uint8Array) return data.slice();
  if (data instanceof ArrayBuffer) return new Uint8Array(data).slice();
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength).slice();
  }
  throw new Error("Tipo de PDF no soportado (usa ArrayBuffer o Uint8Array)");
}

function isFin(n) {
  return Number.isFinite(n);
}

export async function findGerenteGeneralAnchor(pdfArrayBuffer) {
  const dataForPdfJs = toU8Copy(pdfArrayBuffer);

  const task = getDocument({
    data: dataForPdfJs,
    disableWorker: true,
  });

  const pdf = await task.promise;

  try {
    const total = pdf.numPages || 0;
    if (!total) return null;

    const pagesToTry = [];
    for (let i = total; i >= 1 && pagesToTry.length < 3; i--) pagesToTry.push(i);

    const a = "gerente";
    const b = "general";

    for (const pNo of pagesToTry) {
      const page = await pdf.getPage(pNo);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();

      const items = (content.items || [])
        .filter((it) => it && typeof it.str === "string" && it.str.trim() !== "")
        .map((it) => ({
          str: it.str,
          x: isFin(it?.transform?.[4]) ? Number(it.transform[4]) : 0,
          y: isFin(it?.transform?.[5]) ? Number(it.transform[5]) : 0,
        }));

      items.sort((a1, b1) => b1.y - a1.y || a1.x - b1.x);

      const Y_TOL = 2.6;
      const lines = [];
      for (const it of items) {
        const last = lines[lines.length - 1];
        if (!last || Math.abs(it.y - last.y) > Y_TOL) lines.push({ y: it.y, chunks: [it] });
        else last.chunks.push(it);
      }

      for (const ln of lines) {
        const chunks = ln.chunks.slice().sort((x, y) => x.x - y.x);
        const lineText = normalizeText(chunks.map((c) => c.str).join(" "));
        if (!lineText.includes(a) || !lineText.includes(b)) continue;

        const ggChunks = chunks.filter((c) => {
          const s = normalizeText(c.str);
          return s.includes(a) || s.includes(b);
        });
        if (!ggChunks.length) continue;

        const xs = ggChunks.map((c) => c.x).filter(isFin);
        if (!xs.length) continue;

        const x0 = Math.min(...xs);
        const x1 = Math.max(...xs);

        return {
          pageIndex: pNo - 1,
          x0,
          x1,
          y: isFin(ln.y) ? ln.y : ggChunks[0].y,
          viewportW: viewport.width,
          viewportH: viewport.height,
        };
      }
    }

    return null;
  } finally {
    try {
      await pdf?.destroy?.();
    } catch (e) {
      console.log(e);
    }
    try {
      await task?.destroy?.();
    } catch (e) {
      console.log(e);
    }
  }
}

export async function signPdfWithImageSmart(pdfArrayBuffer, imageFile, onStepProgress) {
  if (!imageFile) throw new Error("Falta archivo de firma");

  const pdfU8 = toU8Copy(pdfArrayBuffer);
  onStepProgress?.(10);

  const anchor = await findGerenteGeneralAnchor(pdfU8).catch(() => null);
  onStepProgress?.(20);

  const pdfDoc = await PDFDocument.load(pdfU8);
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];

  const imgBytes = toU8Copy(await imageFile.arrayBuffer());
  const isPng = String(imageFile.type || "").toLowerCase().includes("png");
  const sigImg = isPng ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);

  onStepProgress?.(28);

  const desiredW = 150;
  const desiredH = desiredW * 0.55;
  const margin = 30;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  let page = lastPage;
  let width = page.getWidth();
  let height = page.getHeight();

  let x = width - desiredW - margin;
  let y = margin;

  const anchorOk =
    anchor &&
    isFin(anchor.pageIndex) &&
    pages[anchor.pageIndex] &&
    isFin(anchor.viewportW) &&
    anchor.viewportW > 0 &&
    isFin(anchor.viewportH) &&
    anchor.viewportH > 0 &&
    (isFin(anchor.x0) || isFin(anchor.x)) &&
    (isFin(anchor.x1) || isFin(anchor.x)) &&
    isFin(anchor.y);

  if (anchorOk) {
    page = pages[anchor.pageIndex] || lastPage;
    width = page.getWidth();
    height = page.getHeight();

    const x0 = isFin(anchor.x0) ? anchor.x0 : anchor.x;
    const x1 = isFin(anchor.x1) ? anchor.x1 : anchor.x;

    const centerViewportX = (x0 + x1) / 2;
    const cx = (centerViewportX / anchor.viewportW) * width;
    const py = (anchor.y / anchor.viewportH) * height;

    const Y_UP = -5;
    const X_RIGHT = 25;

    if (isFin(cx) && isFin(py)) {
      x = clamp(cx - desiredW / 2 + X_RIGHT, margin, width - desiredW - margin);
      y = clamp(py + Y_UP, margin, height - desiredH - margin);
    }
  }

  page.drawImage(sigImg, { x, y, width: desiredW, height: desiredH });

  onStepProgress?.(40);
  return await pdfDoc.save();
}
