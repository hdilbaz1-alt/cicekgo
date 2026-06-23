// next build sonrası: out/sw.js içindeki __BUILD_ID__'i benzersiz değerle damgalar + out/version.json yazar.
// Böylece her deploy'da sw.js içeriği değişir → tarayıcı (iOS dahil) yeni Service Worker'ı algılar.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const buildId = `${Date.now().toString(36)}`;
const swPath = 'out/sw.js';

if (!existsSync(swPath)) {
  console.error(`[stamp-sw] ${swPath} bulunamadı (next build çalıştı mı?)`);
  process.exit(0); // build'i bozma
}

let sw = readFileSync(swPath, 'utf8');
sw = sw.replace(/__BUILD_ID__/g, buildId);
writeFileSync(swPath, sw, 'utf8');
writeFileSync('out/version.json', JSON.stringify({ version: buildId }) + '\n', 'utf8');
console.log(`[stamp-sw] BUILD_ID=${buildId} damgalandı (out/sw.js, out/version.json)`);
