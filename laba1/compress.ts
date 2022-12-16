import { createReadStream } from "fs";
import { resolve as resolvePath } from "path";
import { Image, matmul } from "../libs";
import { convertImageToMatrix, readGipperParamsFromFile } from "./utils";

import { writeFile } from "fs/promises";

export async function startCompressing(samplesNames: Array<string>) {
  const { m, n, weightMatrixFirstLayer } = await readGipperParamsFromFile(
    "configuration",
    "firstLayerWeights.txt"
  );

  for (let sampleName of samplesNames) {
    const sampleImage = await Image.readAsync(
      resolvePath(__dirname, "..", "..", "samples", sampleName)
    );

    const N = n * m * 3;

    const some = await convertImageToMatrix(sampleImage, n, m);

    const compres: Array<Array<number>> = [];
    for (const f of some.frames) {
      const y = matmul({ n: 1, m: N, data: [[...f]] }, weightMatrixFirstLayer);
      compres.push(y.data[0]);
    }

    let compressedImageLine = "";
    compres.forEach((array) => {
      compressedImageLine += array.join(" ") + "\n";
    });

    await writeFile(
      resolvePath(
        __dirname,
        "..",
        "..",
        "compressed",
        sampleName.split(".")[0] + ".txt"
      ),
      compressedImageLine
    );
  }

  process.exit(0);
}
