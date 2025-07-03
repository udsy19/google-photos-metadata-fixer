declare module 'decompress' {
  interface DecompressOptions {
    filter?: (file: any) => boolean;
    map?: (file: any) => any;
    plugins?: any[];
    strip?: number;
  }

  interface DecompressFile {
    data: Buffer;
    mode: number;
    mtime: Date;
    path: string;
    type: string;
  }

  function decompress(
    input: string | Buffer,
    output?: string,
    options?: DecompressOptions
  ): Promise<DecompressFile[]>;

  export = decompress;
}