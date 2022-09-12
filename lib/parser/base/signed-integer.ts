import { readUint24be, readUint24le } from "./unsigned-integer";
import { dataview } from "./util";

export const INT8_SIZE = 1;

/**
 * read 8 bit signed integer
 * @param buffer
 * @param offset
 * @returns 8 bit signed integer
 */
export const readInt8 = (buffer: Uint8Array, offset: number) => {
  return dataview(buffer).getInt8(offset);
};

export const INT16_SIZE = 2;
/**
 * read 16 bit signed integer little endian
 * @param buffer
 * @param offset
 * @returns 16 bit signed integer little endian
 */
export const readInt16le = (buffer: Uint8Array, offset: number) => {
  return dataview(buffer).getInt16(offset, true);
};

/**
 * read 16 bit signed integer big endian
 * @param buffer
 * @param offset
 * @returns 16 bit signed integer big endian
 */
export const readInt16be = (buffer: Uint8Array, offset: number) => {
  return dataview(buffer).getInt16(offset);
};

export const INT24_SIZE = 3;

/**
 * read 24 bit signed integer little endian
 * @param buffer
 * @param offset
 * @returns 24 bit signed integer little endian
 */
export const readInt24le = (buffer: Uint8Array, offset: number) => {
  const uint = readUint24le(buffer, offset);

  return uint > 0x7f_ff_ff ? uint - 0x1_00_00_00 : uint;
};

/**
 * read 24 bit signed integer big endian
 * @param buffer
 * @param offset
 * @returns 24 bit signed integer big endian
 */
export const readInt24be = (buffer: Uint8Array, offset: number) => {
  const uint = readUint24be(buffer, offset);

  return uint > 0x7f_ff_ff ? uint - 0x1_00_00_00 : uint;
};

export const INT32_SIZE = 4;

/**
 * read 32 bit signed integer little endian
 * @param buffer
 * @param offset
 * @returns 32 bit signed integer little endian
 */
export const readInt32le = (buffer: Uint8Array, offset: number) => {
  return dataview(buffer).getInt32(offset, true);
};

/**
 * read 32 bit signed integer big endian
 * @param buffer
 * @param offset
 * @returns 32 bit signed integer big endian
 */
export const readInt32be = (buffer: Uint8Array, offset: number) => {
  return dataview(buffer).getInt32(offset);
};

export const INT64_SIZE = 8;

/**
 * read 64 bit signed integer little endian
 * @param buffer
 * @param offset
 * @returns 64 bit signed integer little endian
 */
export const readInt64le = (buffer: Uint8Array, offset: number) => {
  return dataview(buffer).getBigInt64(offset, true);
};

/**
 * read 64 bit signed integer big endian
 * @param buffer
 * @param offset
 * @returns 64 bit signed integer big endian
 */
export const readInt64be = (buffer: Uint8Array, offset: number) => {
  return dataview(buffer).getBigInt64(offset);
};
