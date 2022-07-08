import {
  ITokenizer,
  fromStream,
  fromFile,
  fromBuffer,
} from "../../lib/strtok3";
import { join } from "node:path";
import {
  writeFile,
  createReadStream,
  readFile,
} from "../../lib/strtok3/FsPromise";

export type LoadTokenizer = (testFile: string) => Promise<ITokenizer>;

export function getResourcePath(testFile: string) {
  return join(__dirname, "resources", testFile);
}

export async function getTokenizerWithData(
  testName: string,
  testData: Buffer,
  loadTokenizer: LoadTokenizer
): Promise<ITokenizer> {
  const testFile = `tmp-${testName}.dat`;
  const testPath = getResourcePath(testFile);
  await writeFile(testPath, testData);
  return loadTokenizer(testFile);
}

export const tokenizerCases: [string, LoadTokenizer][] = [
  ["File", async (testFile) => fromFile(getResourcePath(testFile))],
  [
    "Stream",
    async (testFile) => fromStream(createReadStream(getResourcePath(testFile))),
  ],
  [
    "Buffer",
    async (testFile) => fromBuffer(await readFile(getResourcePath(testFile))),
  ],
];
