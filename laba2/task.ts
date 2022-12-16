import { gen, matmul, Matrix, transf, transpose } from "./numpy";

export class network {
  private static reduceMatrixToVector(m: Matrix): Matrix {
    return {
      n: 1,
      m: m.m * m.n,
      data: [m.data.reduce((A, R) => [...A, ...R], [] as Array<number>)],
    };
  }

  private static compareSampleWithOtherSamples(
    y: Matrix,
    rightSamples: Array<Matrix>
  ) {
    return rightSamples.map((sample) =>
      network
        .reduceMatrixToVector(sample)
        .data[0].reduce(
          (prev, value, j) => prev + (value === y.data[0][j] ? 1 : 0),
          0
        )
    );
  }

  static sumMatrixes(a: Matrix, b: Matrix): Matrix {
    return {
      m: a.m,
      n: a.n,
      data: a.data.map((r, i) => {
        return r.map((val, j) => val + b.data[i][j]);
      }),
    };
  }

  static createWeightM(samples: Array<Matrix>) {
    const s1 = samples.map((sample) => network.reduceMatrixToVector(sample));
    const s2 = s1.map((sample) => matmul(transpose(sample), sample));
    const [{ n, m }] = s2;
    let out = gen(n, m, 0);
    s2.forEach((sample) => (out = network.sumMatrixes(out, sample)));
    return transf(out, (val, i, j) => (i == j ? 0 : val));
  }

  static class(wrong: Matrix, rights: Array<Matrix>) {
    rights = rights.map((right) => network.reduceMatrixToVector(right));
    const weights = network.createWeightM(rights);
    const wrongSample = network.reduceMatrixToVector(wrong);

    let y = JSON.parse(JSON.stringify(wrongSample));
    let Y = JSON.parse(JSON.stringify(wrongSample));

    let i = 0;
    let f = true;
    while (f) {
      i += 1;
      Y = JSON.parse(JSON.stringify(y));
      y = transf(matmul(Y, weights), (val, x, y) =>
        val === 0 ? Y.data[x][y] : val > 0 ? 1 : -1
      );

      f = ![network.compareSampleWithOtherSamples(y, [Y])[0]];
    }

    return {
      concurrence: network.compareSampleWithOtherSamples(Y, rights),
      i,
    };
  }
}
