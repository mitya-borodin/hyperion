import { Transform, TransformCallback } from "stream";

export class SizeControllerStream extends Transform {
  public bytes = 0;

  override _transform(chunk: Buffer, _encoding: string, callback: TransformCallback): void {
    this.bytes += chunk.length;

    this.push(chunk);
    this.emit("progress");

    callback();
  }
}
