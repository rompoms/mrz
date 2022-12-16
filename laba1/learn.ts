import { writeFileSync } from "fs";
import { resolve } from "path";

import {
  difference,
  gen,
  matmul,
  Matrix,
  toScalar,
  matmulAlpha,
  rand,
  transpose,
  Image,
} from "../libs";
import { convertImageToMatrix } from "./utils";

export async function startLearning(
  images: Array<string>,
  n: number,
  m: number,
  p: number,
  e: number,
  alpha: number
) {
  let firstLayerWeights, secondLayerWeights;
  const N = n * 3 * m;

  for (let imageName of images) {
    const image = await Image.readAsync(
      resolve(__dirname, "..", "..", "samples", imageName)
    );
    const { frames } = await convertImageToMatrix(image, n, m);
    const L = frames.length;

    firstLayerWeights = firstLayerWeights || gen(N, p, rand);
    secondLayerWeights = secondLayerWeights || transpose(firstLayerWeights);

    let Es = e + 1;
    let steps = 0;

    while (Es > e) {
      Es = 0;
      steps += 1;
      for (const frame of frames) {
        const x: Matrix = { n: 1, m: N, data: [[...frame]] };

        const y = matmul(x, firstLayerWeights);
        const x_ = matmul(y, secondLayerWeights);
        const dx = difference(x_, x);

        firstLayerWeights = difference(
          firstLayerWeights,
          matmulAlpha(
            matmul(matmulAlpha(alpha, transpose(x)), dx).data[0][0],
            transpose(secondLayerWeights)
          )
        );

        secondLayerWeights = difference(
          secondLayerWeights,
          matmul(matmulAlpha(alpha, transpose(y)), dx)
        );

        const Ei = toScalar(dx.data[0]);
        Es += Ei;
      }

      console.debug("Es:", Es);
    }

    console.table({
      Image: imageName,
      Compression: (N * L) / ((N + L) * p + 2),
      Error: Es,
      Steps: steps,
    });
  }

  await Promise.all([
    dumpMatrix(
      firstLayerWeights,
      resolve(__dirname, "..", "..", "configuration", "firstLayerWeights.txt")
    ),
    dumpMatrix(
      secondLayerWeights,
      resolve(__dirname, "..", "..", "configuration", "secondLayerWeights.txt")
    ),
  ]);
}

async function dumpMatrix(matrix: Matrix, filepath) {
  let dumpedValue = "";
  matrix.data.forEach((line) => {
    line.forEach((value) => {
      dumpedValue += value + " ";
    });
    dumpedValue += "\n";
  });

  writeFileSync(filepath, dumpedValue);
}
