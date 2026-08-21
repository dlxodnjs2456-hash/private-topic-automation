import { deflateSync } from "node:zlib";

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePng(width = 1080, height = 1080) {
  const signature = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const row = Buffer.alloc(1 + width * 3);
  row[0] = 0;
  for (let x = 0; x < width; x++) {
    const o = 1 + x * 3;
    const border = x < 24 || x >= width - 24;
    row[o] = border ? 125 : 18;
    row[o + 1] = border ? 140 : 26;
    row[o + 2] = border ? 255 : 47;
  }

  const raw = Buffer.alloc(row.length * height);
  for (let y = 0; y < height; y++) {
    const yBorder = y < 24 || y >= height - 24;
    const target = Buffer.from(row);
    if (yBorder) {
      for (let x = 0; x < width; x++) {
        const o = 1 + x * 3;
        target[o] = 125;
        target[o + 1] = 140;
        target[o + 2] = 255;
      }
    }
    target.copy(raw, y * row.length);
  }

  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end("Method not allowed");
  const png = makePng();
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Content-Length", String(png.length));
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.status(200).send(png);
}
