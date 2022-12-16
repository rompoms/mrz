import { readFileSync as rf } from "fs";
import { resolve } from "path";
import { createInterface } from "readline";
import { network, Matrix } from "../libs";

var max = Math.max;

const ioInterface = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "",
});

if (process.env.NODE_ENV === "prod") {
  console.debug = () => {};
}

const cin = async (prompt: string) => {
  const value = await new Promise((res) => ioInterface.question(prompt, res));
  return value;
};

const readMatrixFromFile = (filename: string) => {
  const data = rf(filename, "utf-8");
  const m: Matrix = {
    n: 0,
    m: 0,
    data: data.split("\n").map((x) =>
      x
        .trim()
        .split(" ")
        .map((num) => (Number(num) == 0 ? -1 : 1))
    ),
  };
  m.n = m.data.length;
  m.m = m.data[0]?.length || 0;
  return m;
};

async function main() {
  const rightsSamples = String(await cin("Правильные примеры: ")).trim();
  const wrongSamples = String(await cin("Неправильные примкеры: ")).trim();
  ioInterface.close();

  if (rightsSamples && wrongSamples) {
    try {
      const rightEInMatrix: Array<Matrix> = [];
      const wrongEInMatrix: Array<Matrix> = [];

      for (const right of rightsSamples.split(" ")) {
        const m = readMatrixFromFile(
          resolve(__dirname, "..", "..", "right", right)
        );
        rightEInMatrix.push(m);
      }

      for (const wrong of wrongSamples.split(" ")) {
        const m = readMatrixFromFile(
          resolve(__dirname, "..", "..", "wrong", wrong)
        );
        wrongEInMatrix.push(m);
      }

      for (let idx = 0; idx < wrongEInMatrix.length; idx += 1) {
        const wrong = wrongEInMatrix[idx];

        const { concurrence, i } = await network.class(wrong, rightEInMatrix);

        const mx =
          rightsSamples.split(" ")[concurrence.indexOf(max(...concurrence))];

        console.log({
          concurrence,
          iterations: i,
          sample: wrongSamples.split(" ")[idx],
          class: mx,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
}

main();
