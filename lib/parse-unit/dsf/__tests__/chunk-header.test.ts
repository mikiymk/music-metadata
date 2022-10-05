import { test, expect, describe } from "vitest";

import { BufferTokenizer } from "../../../strtok3/BufferTokenizer";
import { u8 } from "../../primitive/integer";
import { readUnitFromTokenizer } from "../../utility/read-unit";
import { dsfChunkHeader, type DsfChunkHeader } from "../chunk-header";

test("Dsdiff chunk header size = 12", () => {
  const [size] = dsfChunkHeader;

  expect(size).toBe(12);
});

type Case = [description: string, source: number[], expected: DsfChunkHeader];
const cases: Case[] = [
  [
    "parse Dsdiff chunk header",
    [0x46, 0x4f, 0x52, 0x4d, 0x00, 0x00, 0x00, 0x00, 0x04, 0x03, 0x02, 0x01],
    { id: "FORM", size: 0x01_02_03_04_00_00_00_00n },
  ],
  [
    "parse Dsdiff chunk header",
    [0x66, 0x20, 0x6d, 0x0, 0x01, 0x02, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00],
    { id: "f m\0", size: 0x00_00_00_00_04_03_02_01n },
  ],
];

describe("unit: Dsdiff chunk header", () => {
  test.each(cases)("%s", async (_, bytes, expected) => {
    const buffer = new Uint8Array(bytes);
    const tokenizer = new BufferTokenizer(buffer);
    const result = readUnitFromTokenizer(tokenizer, dsfChunkHeader);

    await expect(result).resolves.toEqual(expected);

    // all bytes are read
    await expect(readUnitFromTokenizer(tokenizer, u8)).rejects.toThrow();
  });
});
