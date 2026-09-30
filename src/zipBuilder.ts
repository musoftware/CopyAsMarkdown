import * as zlib from 'zlib';

export interface ZipEntryInput {
  relativePath: string;
  content: Buffer;
  mtime?: Date;
}

interface ZipInternalEntry {
  pathBuffer: Buffer;
  cleanPath: string;
  crc32: number;
  compressedData: Buffer;
  compressedSize: number;
  uncompressedSize: number;
  dosTime: number;
  dosDate: number;
  localHeaderOffset: number;
}

const CRC_TABLE = generateCrcTable();

function generateCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
}

export function calculateCrc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function toDosDateTime(date: Date): { dosTime: number; dosDate: number } {
  const validYear = Math.max(1980, date.getFullYear());
  const dosTime = ((date.getHours() << 11) | (date.getMinutes() << 5) | (Math.floor(date.getSeconds() / 2))) & 0xffff;
  const dosDate = (((validYear - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()) & 0xffff;
  return { dosTime, dosDate };
}

function sanitizeZipPath(rawPath: string): string {
  return rawPath.replace(/\\/g, '/').replace(/^\/+/, '');
}

function prepareEntry(input: ZipEntryInput, offset: number): ZipInternalEntry {
  const cleanPath = sanitizeZipPath(input.relativePath);
  const pathBuffer = Buffer.from(cleanPath, 'utf8');
  const uncompressedSize = input.content.length;
  const crc32 = calculateCrc32(input.content);
  const compressedData = zlib.deflateRawSync(input.content, { level: 6 });
  const { dosTime, dosDate } = toDosDateTime(input.mtime || new Date());

  return {
    pathBuffer,
    cleanPath,
    crc32,
    compressedData,
    compressedSize: compressedData.length,
    uncompressedSize,
    dosTime,
    dosDate,
    localHeaderOffset: offset
  };
}

function createLocalHeader(entry: ZipInternalEntry): Buffer {
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0); // Local file header signature
  header.writeUInt16LE(20, 4); // Minimum version (2.0)
  header.writeUInt16LE(0x0800, 6); // General purpose flag: UTF-8 encoding
  header.writeUInt16LE(8, 8); // Compression method: Deflate
  header.writeUInt16LE(entry.dosTime, 10);
  header.writeUInt16LE(entry.dosDate, 12);
  header.writeUInt32LE(entry.crc32, 14);
  header.writeUInt32LE(entry.compressedSize, 18);
  header.writeUInt32LE(entry.uncompressedSize, 22);
  header.writeUInt16LE(entry.pathBuffer.length, 26);
  header.writeUInt16LE(0, 28); // Extra field length
  return header;
}

function createCentralHeader(entry: ZipInternalEntry): Buffer {
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0); // Central directory file header signature
  header.writeUInt16LE(20, 4); // Version made by
  header.writeUInt16LE(20, 6); // Version needed to extract
  header.writeUInt16LE(0x0800, 8); // General purpose flag: UTF-8 encoding
  header.writeUInt16LE(8, 10); // Compression method: Deflate
  header.writeUInt16LE(entry.dosTime, 12);
  header.writeUInt16LE(entry.dosDate, 14);
  header.writeUInt32LE(entry.crc32, 16);
  header.writeUInt32LE(entry.compressedSize, 20);
  header.writeUInt32LE(entry.uncompressedSize, 24);
  header.writeUInt16LE(entry.pathBuffer.length, 28);
  header.writeUInt16LE(0, 30); // Extra field length
  header.writeUInt16LE(0, 32); // File comment length
  header.writeUInt16LE(0, 34); // Disk number start
  header.writeUInt16LE(0, 36); // Internal file attributes
  header.writeUInt32LE(0, 38); // External file attributes
  header.writeUInt32LE(entry.localHeaderOffset, 42);
  return header;
}

function createEndOfCentralDirectory(count: number, size: number, offset: number): Buffer {
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // End of central directory signature
  eocd.writeUInt16LE(0, 4); // Disk number
  eocd.writeUInt16LE(0, 6); // Disk where central directory starts
  eocd.writeUInt16LE(count, 8); // Number of central directory records on this disk
  eocd.writeUInt16LE(count, 10); // Total number of central directory records
  eocd.writeUInt32LE(size, 12); // Size of central directory
  eocd.writeUInt32LE(offset, 16); // Offset of start of central directory
  eocd.writeUInt16LE(0, 20); // ZIP file comment length
  return eocd;
}

export function buildZipBuffer(inputs: ZipEntryInput[]): Buffer {
  const localChunks: Buffer[] = [];
  const centralChunks: Buffer[] = [];
  let currentOffset = 0;

  for (const input of inputs) {
    const entry = prepareEntry(input, currentOffset);
    const localHeader = createLocalHeader(entry);

    localChunks.push(localHeader, entry.pathBuffer, entry.compressedData);
    currentOffset += 30 + entry.pathBuffer.length + entry.compressedSize;

    const centralHeader = createCentralHeader(entry);
    centralChunks.push(centralHeader, entry.pathBuffer);
  }

  const centralDirectoryOffset = currentOffset;
  const centralDirectorySize = centralChunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const eocd = createEndOfCentralDirectory(inputs.length, centralDirectorySize, centralDirectoryOffset);

  return Buffer.concat([...localChunks, ...centralChunks, eocd]);
}
