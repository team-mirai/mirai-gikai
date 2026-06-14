import fs from "node:fs/promises";
import path from "node:path";
import {
  parseBillUpdateCsv,
  serializeBillUpdateCsv,
} from "./bill-update-csv";
import { applyR8FebOfficialData } from "./r8-feb-bill-data";

const CSV_PATH = path.resolve(
  import.meta.dirname,
  "data",
  "bills-update.csv"
);

async function prepareR8FebBills() {
  const csv = await fs.readFile(CSV_PATH, "utf8");
  const rows = parseBillUpdateCsv(csv);
  const updatedRows = rows.map(applyR8FebOfficialData);

  await fs.writeFile(
    CSV_PATH,
    serializeBillUpdateCsv(updatedRows),
    "utf8"
  );
  console.log(`Prepared ${updatedRows.length} bills in ${CSV_PATH}`);
}

prepareR8FebBills().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
