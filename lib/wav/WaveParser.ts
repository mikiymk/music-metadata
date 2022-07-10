import * as strtok3 from "../strtok3";
import * as fromBuffer from "../strtok3/fromBuffer";
import * as Token from "../token-types";
import initDebug from "debug";

import { IChunkHeader, Header } from "../riff/RiffHeader";
import { ListInfoTagValue } from "../riff/RiffInfo";
import { ID3v2Parser } from "../id3v2/ID3v2Parser";
import * as util from "../common/Util";
import { FourCcToken } from "../common/FourCC";
import { BasicParser } from "../common/BasicParser";
import { IWaveFormat, Format, WaveFormat } from "./WaveFormat";
import { IFactChunk, FactChunk } from "./FactChunk";
import { BroadcastAudioExtensionChunk } from "./BwfChunk";

const debug = initDebug("music-metadata:parser:RIFF");

/**
 * Resource Interchange File Format (RIFF) Parser
 *
 * WAVE PCM soundfile format
 *
 * Ref:
 * - http://www.johnloomis.org/cpe102/asgn/asgn1/riff.html
 * - http://soundfile.sapp.org/doc/WaveFormat
 *
 * ToDo: Split WAVE part from RIFF parser
 */
export class WaveParser extends BasicParser {
  private fact: IFactChunk;

  private blockAlign: number;
  private header: IChunkHeader;

  public async parse(): Promise<void> {
    const riffHeader = await this.tokenizer.readToken<IChunkHeader>(Header);
    debug(`pos=${this.tokenizer.position}, parse: chunkID=${riffHeader.chunkID}`);
    if (riffHeader.chunkID !== "RIFF") return; // Not RIFF format
    return this.parseRiffChunk(riffHeader.chunkSize).catch((error) => {
      if (!(error instanceof strtok3.EndOfStreamError)) {
        throw error;
      }
    });
  }

  public async parseRiffChunk(chunkSize: number): Promise<void> {
    const type = await this.tokenizer.readToken<string>(FourCcToken);
    this.metadata.setFormat("container", type);
    switch (type) {
      case "WAVE":
        return this.readWaveChunk(chunkSize - FourCcToken.len);
      default:
        throw new Error(`Unsupported RIFF format: RIFF/${type}`);
    }
  }

  public async readWaveChunk(remaining: number): Promise<void> {
    while (remaining >= Header.len) {
      const header = await this.tokenizer.readToken<IChunkHeader>(Header);
      remaining -= Header.len + header.chunkSize;
      if (header.chunkSize > remaining) {
        this.metadata.addWarning("Data chunk size exceeds file size");
      }

      this.header = header;
      debug(`pos=${this.tokenizer.position}, readChunk: chunkID=RIFF/WAVE/${header.chunkID}`);
      switch (header.chunkID) {
        case "LIST":
          await this.parseListTag(header);
          break;

        case "fact": // extended Format chunk,
          this.metadata.setFormat("lossless", false);
          this.fact = await this.tokenizer.readToken(new FactChunk(header));
          break;

        case "fmt ": {
          // The Util Chunk, non-PCM Formats
          const fmt = await this.tokenizer.readToken<IWaveFormat>(new Format(header));

          let subFormat = WaveFormat[fmt.wFormatTag];
          if (!subFormat) {
            debug(`WAVE/non-PCM format=${fmt.wFormatTag}`);
            subFormat = `non-PCM (${fmt.wFormatTag})`;
          }
          this.metadata.setFormat("codec", subFormat);
          this.metadata.setFormat("bitsPerSample", fmt.wBitsPerSample);
          this.metadata.setFormat("sampleRate", fmt.nSamplesPerSec);
          this.metadata.setFormat("numberOfChannels", fmt.nChannels);
          this.metadata.setFormat("bitrate", fmt.nBlockAlign * fmt.nSamplesPerSec * 8);
          this.blockAlign = fmt.nBlockAlign;
          break;
        }

        case "id3 ":
        case "ID3 ": {
          // The way Picard, FooBar currently stores, ID3 meta-data
          // The way Mp3Tags stores ID3 meta-data
          const id3_data = await this.tokenizer.readToken<Uint8Array>(new Token.Uint8ArrayType(header.chunkSize));
          const rst = fromBuffer.fromBuffer(id3_data);
          await new ID3v2Parser().parse(this.metadata, rst, this.options);
          break;
        }
        case "data": {
          // PCM-data
          if (this.metadata.format.lossless !== false) {
            this.metadata.setFormat("lossless", true);
          }

          let chunkSize = header.chunkSize;
          if (this.tokenizer.fileInfo.size > 0) {
            const calcRemaining = this.tokenizer.fileInfo.size - this.tokenizer.position;
            if (calcRemaining < chunkSize) {
              this.metadata.addWarning("data chunk length exceeding file length");
              chunkSize = calcRemaining;
            }
          }

          const numberOfSamples = this.fact
            ? this.fact.dwSampleLength
            : chunkSize === 0xff_ff_ff_ff
            ? undefined
            : chunkSize / this.blockAlign;
          if (numberOfSamples) {
            this.metadata.setFormat("numberOfSamples", numberOfSamples);
            this.metadata.setFormat("duration", numberOfSamples / this.metadata.format.sampleRate);
          }

          this.metadata.setFormat(
            "bitrate",
            this.metadata.format.numberOfChannels * this.blockAlign * this.metadata.format.sampleRate
          ); // ToDo: check me
          await this.tokenizer.ignore(header.chunkSize);
          break;
        }

        case "bext": {
          // Broadcast Audio Extension chunk	https://tech.ebu.ch/docs/tech/tech3285.pdf
          const bext = await this.tokenizer.readToken(BroadcastAudioExtensionChunk);
          for (const [key, value] of Object.entries(bext)) {
            this.metadata.addTag("exif", "bext." + key, value);
          }
          break;
        }

        case "\u0000\u0000\u0000\u0000": // padding ??
          debug(`Ignore padding chunk: RIFF/${header.chunkID} of ${header.chunkSize} bytes`);
          this.metadata.addWarning("Ignore chunk: RIFF/" + header.chunkID);
          await this.tokenizer.ignore(header.chunkSize);
          break;

        default:
          debug(`Ignore chunk: RIFF/${header.chunkID} of ${header.chunkSize} bytes`);
          this.metadata.addWarning("Ignore chunk: RIFF/" + header.chunkID);
          await this.tokenizer.ignore(header.chunkSize);
      }

      if (this.header.chunkSize % 2 === 1) {
        debug("Read odd padding byte"); // https://wiki.multimedia.cx/index.php/RIFF
        await this.tokenizer.ignore(1);
      }
    }
  }

  public async parseListTag(listHeader: IChunkHeader): Promise<void> {
    const listType = await this.tokenizer.readToken(new Token.StringType(4, "binary"));
    debug("pos=%s, parseListTag: chunkID=RIFF/WAVE/LIST/%s", this.tokenizer.position, listType);
    switch (listType) {
      case "INFO":
        return this.parseRiffInfoTags(listHeader.chunkSize - 4);

      // case "adtl":
      default:
        this.metadata.addWarning("Ignore chunk: RIFF/WAVE/LIST/" + listType);
        debug("Ignoring chunkID=RIFF/WAVE/LIST/" + listType);
        return this.tokenizer.ignore(listHeader.chunkSize - 4).then();
    }
  }

  private async parseRiffInfoTags(chunkSize: number): Promise<void> {
    while (chunkSize >= 8) {
      const header = await this.tokenizer.readToken<IChunkHeader>(Header);
      const valueToken = new ListInfoTagValue(header);
      const value = await this.tokenizer.readToken(valueToken);
      this.addTag(header.chunkID, util.stripNulls(value));
      chunkSize -= 8 + valueToken.len;
    }

    if (chunkSize !== 0) {
      throw new Error(`Illegal remaining size: ${chunkSize}`);
    }
  }

  private addTag(id: string, value: any) {
    this.metadata.addTag("exif", id, value);
  }
}
