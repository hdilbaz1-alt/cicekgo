// Logo görselleri için yardımcılar — tamamı client-side (dış servis yok, gizlilik korunur).

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB

export function validateImageFile(file: File): { ok: boolean; error?: string } {
  const type = (file.type || '').toLowerCase();
  if (!ACCEPTED_IMAGE_TYPES.includes(type)) return { ok: false, error: 'Yalnızca PNG, JPG veya WEBP yükleyebilirsiniz.' };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: `Dosya çok büyük (en fazla ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB).` };
  return { ok: true };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Dosya okunamadı'));
    r.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Görsel yüklenemedi'));
    img.src = src;
  });
}

/**
 * Kırpma sonucu üretir. Cropper'ın görünür çerçevesi = kaynak görselin
 * (offsetX, offsetY) noktasından scale ile çizilmiş hali. Çerçeve boyutu frameW×frameH.
 * Çıktı, oranı koruyarak en fazla maxOut piksel olacak şekilde ölçeklenir.
 */
export async function renderCrop(
  src: string,
  opts: { frameW: number; frameH: number; scale: number; offsetX: number; offsetY: number; maxOut?: number },
): Promise<string> {
  const img = await loadImage(src);
  const { frameW, frameH, scale, offsetX, offsetY } = opts;
  const maxOut = opts.maxOut ?? 640;
  const ratio = Math.min(1, maxOut / Math.max(frameW, frameH));
  const outW = Math.round(frameW * ratio);
  const outH = Math.round(frameH * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = outW; canvas.height = outH;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, outW, outH);
  // Çerçevedeki çizim: image, (offsetX,offsetY) konumunda, scale ile. Çıktıya ratio ile uygula.
  const dw = img.naturalWidth * scale * ratio;
  const dh = img.naturalHeight * scale * ratio;
  ctx.drawImage(img, offsetX * ratio, offsetY * ratio, dw, dh);
  return canvas.toDataURL('image/png');
}

/**
 * Canvas tabanlı arka plan kaldırma: köşelerden zemin rengini örnekler,
 * o renge yakın pikselleri şeffaflaştırır (yumuşak geçişli). Şeffaf PNG döndürür.
 * Düz/tek renk (özellikle beyaz) zeminli logolar için uygundur.
 */
export async function removeBackground(src: string, tolerance = 32): Promise<string> {
  const img = await loadImage(src);
  const cap = 1000;
  const s = Math.min(1, cap / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * s));
  const h = Math.max(1, Math.round(img.naturalHeight * s));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;

  // Köşe örnekleri ile zemin rengini bul
  const sample = (x: number, y: number) => { const i = (y * w + x) * 4; return [px[i], px[i + 1], px[i + 2]]; };
  const corners = [sample(0, 0), sample(w - 1, 0), sample(0, h - 1), sample(w - 1, h - 1)];
  const bg = [0, 1, 2].map((c) => Math.round(corners.reduce((a, k) => a + k[c], 0) / corners.length));

  const feather = tolerance * 1.6;
  for (let i = 0; i < px.length; i += 4) {
    const dr = px[i] - bg[0], dg = px[i + 1] - bg[1], db = px[i + 2] - bg[2];
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist <= tolerance) px[i + 3] = 0;
    else if (dist < feather) px[i + 3] = Math.round(px[i + 3] * ((dist - tolerance) / (feather - tolerance)));
  }
  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL('image/png');
}
