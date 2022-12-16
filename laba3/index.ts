import { createInterface } from "readline";

import * as learning from "./learn";
import * as predicating from "./predication";

const inputInterface = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "",
});

if (process.env.NODE_ENV === "prod") {
  console.debug = () => {};
}

const cin = async (prompt: string) => {
  const value = await new Promise((res) =>
    inputInterface.question(prompt, res)
  );
  return value;
};

async function main() {
  console.log("Выберете режим: ");
  console.table(["Обучение", "Предсказание"]);
  console.log("По умолчанию - выход");

  const letter = await cin("> ");

  switch (letter) {
    case "0": {
      const sequence = String(await cin("Последовательность: "))
        .trim()
        .split(" ")
        .map((val) => Number(val));

      const availableIterations = Number(await cin("Кол-во итераций: "));
      const alpha = Number(await cin("Альфа: "));
      const p = Number(await cin("Размер окна: "));
      const m = Number(await cin("Размер второго слоя: "));
      const error = Number(await cin("Допустимая ошибка: "));
      const mode = String(await cin("Мод: "))
        .trim()
        .split(" ")
        .map((val) => Boolean(val));

      inputInterface.close();

      await learning.startLearning({
        alpha,
        mode,
        availableIterations,
        error,
        sequence,
        m,
        p,
      });

      break;
    }

    case "1": {
      const sequence = String(await cin("Последовательность: "))
        .trim()
        .split(" ")
        .map((val) => Number(val));
      const n = Number(await cin("Кол-во предс. элементов: "));

      const mode = String(await cin("Мод: "))
        .trim()
        .split(" ")
        .map((val) => Boolean(val));

      await predicating.startPredicating({ sequence, mode, n });

      inputInterface.close();
      break;
    }
  }
  process.exit();
}

main();
