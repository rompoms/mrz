import { createReadStream } from "fs";
import { resolve } from "path";
import { Image, matmul, Matrix, TypeMatrix } from "../libs";

import { createInterface } from "readline";
import {
  deconvertImageToMatrix,
  readCompressedFile,
  readGipperParamsFromFile,
} from "./utils";

export async function startDecompressing(samplesNames: Array<string>) {
  const { m, n, weightMatrixFirstLayer } = await readGipperParamsFromFile(
    "configuration",
    "secondLayerWeights.txt",
    false
  );

  for (let imageName of samplesNames) {
    const compressImage = await readCompressedFile(
      resolve(
        __dirname,
        "..",
        "..",
        "compressed",
        imageName.split(".")[0] + ".txt"
      )
    );

    const N = weightMatrixFirstLayer.n;
    const decompresArrays: TypeMatrix = [];

    for (const compressVector of compressImage) {
      const y = { n: 1, m: N, data: [[...compressVector]] };
      const x = matmul(y, weightMatrixFirstLayer);

      decompresArrays.push(x.data[0]);
    }

    const { image } = await deconvertImageToMatrix(decompresArrays, n, m);

    await Image.writeAsync(
      resolve(__dirname, "..", "..", "decompressed", imageName),
      image
    );
  }

  process.exit(0);
}
