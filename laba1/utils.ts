import { createReadStream } from "fs";
import { readFile } from "fs/promises";
import { createInterface } from "readline";
import { resolve as resolvePath } from "path";

import { Image, Matrix, TypeMatrix } from "../libs";

export async function convertImageToMatrix(image, n, m) {
  const CMAX = 255;

  const convertPixelsToArrays = await Image.normolize(image.pixels, CMAX);
  const recs = await Image.divide(n, m, {
    h: image.h,
    w: image.w,
    pixels: convertPixelsToArrays,
  });

  const frames: Array<Array<number>> = [];

  for (const rec of recs) {
    const { vector } = await Image.transformPixels(rec.pixels);
    frames.push(vector);
  }

  return { frames };
}

export async function deconvertImageToMatrix(arrays: TypeMatrix, n, m) {
  const decompressRectangles: Array<any> = [];

  for (let i = 0; i < arrays.length; i += 1) {
    decompressRectangles.push({
      n,
      m,
      pixels: Image.transformVector(arrays[i]),
    });
  }

  const decompresImage = await Image.join(256, 256, decompressRectangles);

  const pixels2 = await Image.denormolize(decompresImage.pixels, 255);

  decompresImage.pixels = pixels2;

  return { image: decompresImage };
}

export async function readCompressedFile(
  pathToCompressedFile: string
): Promise<TypeMatrix> {
  const file = await readFile(pathToCompressedFile, "utf8");

  return file.split("\n").map((line) => {
    return line.split(" ").map((num) => Number(num));
  });
}

export async function readGipperParamsFromFile(
  configFile: string,
  pathToWeight: string,
  compressing = true
) {
  let imagesConvertedToMatrix: Array<Array<number>> = [];
  const weightMatrix = createInterface({
    input: createReadStream(
      resolvePath(__dirname, "..", "..", configFile, pathToWeight)
    ),
  });
  for await (const line of weightMatrix) {
    const bits = line.trim().split(" ");
    imagesConvertedToMatrix.push(bits.map((value) => Number(value)));
  }

  const weightFirstLayer: Matrix = {
    n: imagesConvertedToMatrix.length,
    m: imagesConvertedToMatrix[0]?.length,
    data: imagesConvertedToMatrix,
  };
  let n = 0,
    m = 0,
    height = (compressing ? weightFirstLayer.n : weightFirstLayer.m) / 3;

  for (let index = 2; index < height; index += 1) {
    if (height % index === 0) {
      n = index;
      m = height / index;
      break;
    }
  }

  return {
    weightMatrixFirstLayer: weightFirstLayer,
    n,
    m,
  };
}
