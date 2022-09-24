import { test, expect } from "vitest";

import { BufferTokenizer } from "../../../strtok3/BufferTokenizer";
import { readUnitFromTokenizer } from "../../utility/read-unit";
import { latin1, utf8, utf16, utf16be, utf16le } from "../string";

test("unit: string Latin-1", async () => {
  const buffer = new Uint8Array([
    0x31, 0x32, 0x33, 0x61, 0x62, 0x63,

    0x00, 0x01, 0x02, 0x03, 0x04, 0x7f,

    0x80, 0x81, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87,

    0x88, 0x89, 0x8a, 0x8b, 0x8c, 0x8d, 0x8e, 0x8f,

    0x90, 0x91, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97,

    0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9d, 0x9e, 0x9f,
  ]);
  const tokenizer = new BufferTokenizer(buffer);

  await expect(readUnitFromTokenizer(tokenizer, latin1(6))).resolves.toBe("123abc");
  await expect(readUnitFromTokenizer(tokenizer, latin1(6))).resolves.toBe("\u0000\u0001\u0002\u0003\u0004\u007F");

  // windows-1252
  await expect(readUnitFromTokenizer(tokenizer, latin1(8))).resolves.toBe("€\u0081‚ƒ„…†‡");
  await expect(readUnitFromTokenizer(tokenizer, latin1(8))).resolves.toBe("ˆ‰Š‹Œ\u008DŽ\u008F");
  await expect(readUnitFromTokenizer(tokenizer, latin1(8))).resolves.toBe("\u0090‘’“”•–—");
  await expect(readUnitFromTokenizer(tokenizer, latin1(8))).resolves.toBe("˜™š›œ\u009DžŸ");
});

test("unit: string UTF-8", async () => {
  const buffer = new Uint8Array([
    0x31, 0x32, 0x33, 0x61, 0x62, 0x63,

    0xc2, 0xb6, 0xc3, 0x83, 0xd0, 0x96, 0xd4, 0x98, 0xdf, 0xb7, 0xdf, 0xb6,

    0xe0, 0xb8, 0xa5, 0xe1, 0x80, 0xaa, 0xe1, 0xb4, 0x94, 0xe2, 0x82, 0xa4, 0xea, 0xb1, 0x86, 0xef, 0xa5, 0x87,

    0xf0, 0x91, 0x87, 0xb0, 0xf0, 0x92, 0x88, 0x99, 0xf0, 0x96, 0xa0, 0x8a, 0xf0, 0x9d, 0x95, 0x8a, 0xf0, 0x9f, 0x82,
    0xbd, 0xf0, 0x9f, 0x91, 0xbe,
  ]);
  const tokenizer = new BufferTokenizer(buffer);

  // 1 byte characters
  await expect(readUnitFromTokenizer(tokenizer, utf8(6))).resolves.toBe("123abc");

  // 2 bytes characters
  await expect(readUnitFromTokenizer(tokenizer, utf8(12))).resolves.toBe("¶ÃЖԘ߷߶");

  // 3 bytes characters
  await expect(readUnitFromTokenizer(tokenizer, utf8(18))).resolves.toBe("ลဪᴔ₤걆磊");

  // 4 bytes characters
  await expect(readUnitFromTokenizer(tokenizer, utf8(24))).resolves.toBe("𑇰𒈙𖠊𝕊🂽👾");
});

test("unit: string UTF-16 big endian", async () => {
  const buffer = new Uint8Array([
    0x00, 0x31, 0x00, 0x61, 0x00, 0xb6, 0x04, 0x16, 0x20, 0xa4, 0xac, 0x46,

    0xd8, 0x04, 0xdd, 0xf0, 0xd8, 0x08, 0xde, 0x19, 0xd8, 0x1a, 0xdc, 0x0a, 0xd8, 0x35, 0xdd, 0x4a, 0xd8, 0x3c, 0xdc,
    0xbd, 0xd8, 0x3d, 0xdc, 0x7e,
  ]);
  const tokenizer = new BufferTokenizer(buffer);

  // 2 bytes characters
  await expect(readUnitFromTokenizer(tokenizer, utf16be(12))).resolves.toBe("1a¶Ж₤걆");

  // 4 bytes characters
  await expect(readUnitFromTokenizer(tokenizer, utf16be(24))).resolves.toBe("𑇰𒈙𖠊𝕊🂽👾");
});

test("unit: string UTF-16 little endian", async () => {
  const buffer = new Uint8Array([
    0x31, 0x00, 0x61, 0x00, 0xb6, 0x00, 0x16, 0x04, 0xa4, 0x20, 0x46, 0xac,

    0x04, 0xd8, 0xf0, 0xdd, 0x08, 0xd8, 0x19, 0xde, 0x1a, 0xd8, 0x0a, 0xdc, 0x35, 0xd8, 0x4a, 0xdd, 0x3c, 0xd8, 0xbd,
    0xdc, 0x3d, 0xd8, 0x7e, 0xdc,
  ]);
  const tokenizer = new BufferTokenizer(buffer);

  // 2 bytes characters
  await expect(readUnitFromTokenizer(tokenizer, utf16le(12))).resolves.toBe("1a¶Ж₤걆");

  // 4 bytes characters
  await expect(readUnitFromTokenizer(tokenizer, utf16le(24))).resolves.toBe("𑇰𒈙𖠊𝕊🂽👾");
});

test("unit: string UTF-16 bom", async () => {
  const buffer = new Uint8Array([
    0xfe, 0xff, 0x00, 0x31, 0x00, 0x61, 0x00, 0xb6, 0x04, 0x16, 0x20, 0xa4, 0xac, 0x46,

    0xfe, 0xff, 0xd8, 0x04, 0xdd, 0xf0, 0xd8, 0x08, 0xde, 0x19, 0xd8, 0x1a, 0xdc, 0x0a, 0xd8, 0x35, 0xdd, 0x4a, 0xd8,
    0x3c, 0xdc, 0xbd, 0xd8, 0x3d, 0xdc, 0x7e,

    0xff, 0xfe, 0x31, 0x00, 0x61, 0x00, 0xb6, 0x00, 0x16, 0x04, 0xa4, 0x20, 0x46, 0xac,

    0xff, 0xfe, 0x04, 0xd8, 0xf0, 0xdd, 0x08, 0xd8, 0x19, 0xde, 0x1a, 0xd8, 0x0a, 0xdc, 0x35, 0xd8, 0x4a, 0xdd, 0x3c,
    0xd8, 0xbd, 0xdc, 0x3d, 0xd8, 0x7e, 0xdc,
  ]);
  const tokenizer = new BufferTokenizer(buffer);

  // big endian

  // 2 bytes characters
  await expect(readUnitFromTokenizer(tokenizer, utf16(14))).resolves.toBe("1a¶Ж₤걆");

  // 4 bytes characters
  await expect(readUnitFromTokenizer(tokenizer, utf16(26))).resolves.toBe("𑇰𒈙𖠊𝕊🂽👾");

  // little endian

  // 2 bytes characters
  await expect(readUnitFromTokenizer(tokenizer, utf16(14))).resolves.toBe("1a¶Ж₤걆");

  // 4 bytes characters
  await expect(readUnitFromTokenizer(tokenizer, utf16(26))).resolves.toBe("𑇰𒈙𖠊𝕊🂽👾");
});
