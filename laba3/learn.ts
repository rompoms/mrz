import { writeFileSync } from "fs";
import { resolve } from "path";
import {
  difference,
  gen,
  matmul,
  Matrix,
  rand,
  transf,
  transpose,
  TypeMatrix,
  TypeRow,
} from "../libs";

function activateFunction(value: number) {
  return 1 / (1 + Math.exp(-value));
}

const multiplication = matmul;
const transparent = transpose;

function deactivateFunction(value: number) {
  return activateFunction(value) * (1 - activateFunction(value));
}

export async function startLearning({
  availableIterations,
  alpha,
  p,
  m,
  error,
  mode,
  sequence,
}: {
  availableIterations: number;
  alpha: number;
  p: number;
  m: number;
  error: number;
  mode: Array<boolean>;
  sequence: Array<number>;
}) {
  const sampls: TypeMatrix = [];
  const expects: TypeRow = [];

  let curr = 0;
  while (curr + p < sequence.length) {
    sampls.push(sequence.slice(curr, curr + p));
    expects.push(sequence[curr + p]);
    curr += 1;
  }

  let w1 = gen(p + m, m, rand);
  let w2 = gen(m, 1, rand);
  let context: Matrix;

  if (mode[0]) {
    context = gen(1, m, rand);
  } else {
    context = gen(1, m, 0);
  }

  let Es = 0;
  let iters = availableIterations;

  for (let iter = 0; iter < availableIterations; iter += 1) {
    if (iter !== 0 && mode[1]) {
      context = gen(1, m, 0);
    }

    Es = 0;

    for (let sampleIndex = 0; sampleIndex < sampls.length; sampleIndex += 1) {
      const H = transf(
        matmul(
          {
            n: 1,
            m: m + p,
            data: [sampls[sampleIndex].concat(context.data[0])],
          },
          w1
        ),
        activateFunction
      );
      const Y = transf(matmul(H, w2), activateFunction);

      w1 = difference(
        w1,
        transf(
          multiplication(
            matmul(
              transpose({
                n: 1,
                m: m + p,
                data: [sampls[sampleIndex].concat(context.data[0])],
              }),
              transparent(w2)
            ),
            transf(
              multiplication(
                {
                  n: 1,
                  m: m + p,
                  data: [sampls[sampleIndex].concat(context.data[0])],
                },
                w1
              ),
              deactivateFunction
            )
          ),
          (value) => value * alpha * Y.data[0][0] - expects[sampleIndex]
        )
      );

      w2 = difference(
        w2,
        transf(
          matmul(
            transparent(H),
            transf(multiplication(H, w2), deactivateFunction)
          ),
          (value: number) => value * alpha * Y.data[0][0] - expects[sampleIndex]
        )
      );

      context = JSON.parse(JSON.stringify(H));
    }

    for (let idx = 0; idx < sampls.length; idx += 1) {
      const Y = multiplication(
        matmul(
          {
            n: 1,
            m: m + p,
            data: [sampls[idx].concat(context.data[0])],
          },
          w1
        ),
        w2
      );
      Es += (Y.data[0][0] - expects[idx]) * (Y.data[0][0] - expects[idx]);
    }

    console.debug(`E: ${Es}`);

    if (Es < error) {
      iters = iter;
      break;
    }
  }

  console.table({
    sequence: sequence.join(" "),
    Es,
    iters,
  });

  await Promise.all([
    dumpMatrix(w1, resolve(__dirname, "..", "..", "configuration", "1.txt")),
    dumpMatrix(w2, resolve(__dirname, "..", "..", "configuration", "2.txt")),
    dumpMatrix(
      context,
      resolve(__dirname, "..", "..", "configuration", "ctx.txt")
    ),
  ]);
}

async function dumpMatrix(matrix: Matrix, filepath: string) {
  let dumpedValue = "";
  matrix.data.forEach((line) => {
    line.forEach((value) => {
      dumpedValue += value + " ";
    });
    dumpedValue += "\n";
  });

  writeFileSync(filepath, dumpedValue);
}
