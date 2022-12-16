import { createInterface } from "readline";

import * as compressing from "./compress";
import * as learning from "./learn";
import * as decompressing from "./decompress";

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
  const files: Array<string> = process.argv.slice(2);

  if (files.length) {
    console.log("Please, choice mode: ");
    console.table(["Learning", "Compressing", "Decompressing"]);
    console.log("Defualt - exit");

    const letter = await cin("> ");

    switch (letter) {
      case "0": {
        const n = Number(await cin("n: "));
        const m = Number(await cin("m: "));
        const p = Number(await cin("p: "));
        const e = Number(await cin("e: "));
        const alpha = Number(await cin("alpha: "));
        inputInterface.close();

        await learning.startLearning(files, n, m, p, e, alpha);

        break;
      }

      case "1": {
        await compressing.startCompressing(files);
        inputInterface.close();

        break;
      }

      case "2": {
        await decompressing.startDecompressing(files);
        inputInterface.close();

        break;
      }
    }
  } else {
    console.log("files not defined");
    console.log("Example:");
    console.log("$: npm run start <filename> <filename> <filebame> ...");
  }

  process.exit();
}

main();
