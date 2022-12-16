import { resolve } from "path";
import { gen, matmul, Matrix, TypeRow } from "../libs";
import { readFileSync as rf } from "fs";

const readMatrixFromFile = (filename: string) => {
  const data = rf(filename, "utf-8");
  const m: Matrix = {
    n: 0,
    m: 0,
    data: data
      .trim()
      .split("\n")
      .map((x) =>
        x
          .trim()
          .split(" ")
          .map((num) => Number(num))
      ),
  };
  m.n = m.data.length;
  m.m = m.data[0]?.length || 0;
  return m;
};

export async function startPredicating({
  mode,
  sequence,
  n,
}: {
  n: number;
  mode: Array<boolean>;
  sequence: Array<number>;
}) {
  const w1 = await readMatrixFromFile(
    resolve(__dirname, "..", "..", "configuration", "1.txt")
  );

  const w2 = await readMatrixFromFile(
    resolve(__dirname, "..", "..", "configuration", "2.txt")
  );
  const ctx = await readMatrixFromFile(
    resolve(__dirname, "..", "..", "configuration", "ctx.txt")
  );
  const p = w1.n - ctx.m;
  const m = w2.m;

  const seq = sequence;
  const predictedValues: TypeRow = [];
  const ins = seq.slice(seq.length - p);
  let context;

  if (mode[0]) {
    context = ctx;
  } else {
    context = gen(1, m, 0);
  }

  for (let i = 0; i < n; i += 1) {
    if (i !== 0 && !mode[1]) {
      context = gen(1, m, 0);
    }
    predictedValues.push(
      matmul(
        matmul(
          {
            n: 1,
            m: m + p,
            data: [ins.concat(context.data[0])],
          },
          w1
        ),
        w2
      ).data[0][0]
    );

    ins.push(predictedValues[predictedValues.length - 1]);
    ins.shift();
  }

  console.log("Предсказанные числа: ", predictedValues);

  return;
}
