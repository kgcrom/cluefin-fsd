import { parseArgs } from "node:util";
import { WRANGLER_CONFIG } from "../utils";

const DB_NAME = "cluefin-db";

async function execD1(sql: string): Promise<string> {
  const proc = Bun.spawn(
    ["bunx", "wrangler", "d1", "execute", DB_NAME, "--command", sql, "--config", WRANGLER_CONFIG],
    { stdout: "pipe", stderr: "pipe" },
  );

  const exitCode = await proc.exited;
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();

  if (exitCode !== 0) {
    console.error(`D1 명령 실패:\n${stderr}`);
    process.exit(1);
  }

  return stdout;
}

function escapeSQL(value: string): string {
  return value.replace(/'/g, "''");
}

async function addOrder(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      "stock-code": { type: "string" },
      "stock-name": { type: "string" },
      side: { type: "string" },
      price: { type: "string" },
      qty: { type: "string" },
      broker: { type: "string" },
      "trailing-stop": { type: "string" },
      "volume-threshold": { type: "string" },
      memo: { type: "string" },
    },
    strict: true,
  });

  const stockCode = values["stock-code"];
  const side = values.side;
  const price = values.price;
  const qty = values.qty;
  const broker = values.broker;

  if (!stockCode || !side || !price || !qty || !broker) {
    console.error(
      "Usage: order add --stock-code <code> --side <buy|sell> --price <n> --qty <n> --broker <kis|kiwoom>",
    );
    console.error(
      "  옵션: --trailing-stop <pct> --volume-threshold <n> --stock-name <name> --memo <memo>",
    );
    process.exit(1);
  }

  if (!["buy", "sell"].includes(side)) {
    console.error('side는 "buy" 또는 "sell"이어야 합니다.');
    process.exit(1);
  }
  if (!["kis", "kiwoom"].includes(broker)) {
    console.error('broker는 "kis" 또는 "kiwoom"이어야 합니다.');
    process.exit(1);
  }

  const trailingStop = values["trailing-stop"] ?? "3.0";
  const stockName = values["stock-name"];
  const volumeThreshold = values["volume-threshold"];
  const memo = values.memo;

  const columns = [
    "stock_code",
    "side",
    "reference_price",
    "quantity",
    "trailing_stop_pct",
    "broker",
  ];
  const vals = [
    `'${escapeSQL(stockCode)}'`,
    `'${escapeSQL(side)}'`,
    price,
    qty,
    trailingStop,
    `'${escapeSQL(broker)}'`,
  ];

  if (stockName) {
    columns.push("stock_name");
    vals.push(`'${escapeSQL(stockName)}'`);
  }
  if (volumeThreshold) {
    columns.push("volume_threshold");
    vals.push(volumeThreshold);
  }
  if (memo) {
    columns.push("memo");
    vals.push(`'${escapeSQL(memo)}'`);
  }

  const sql = `INSERT INTO trade_orders (${columns.join(", ")}) VALUES (${vals.join(", ")})`;
  const output = await execD1(sql);
  console.log("주문 추가 완료");
  if (output.trim()) console.log(output);
}

async function listOrders(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      broker: { type: "string" },
      status: { type: "string" },
    },
    strict: true,
  });

  let sql = "SELECT * FROM trade_orders";
  const conditions: string[] = [];

  if (values.broker) {
    conditions.push(`broker = '${escapeSQL(values.broker)}'`);
  }
  if (values.status) {
    conditions.push(`status = '${escapeSQL(values.status)}'`);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  sql += " ORDER BY created_at DESC";

  const output = await execD1(sql);
  console.log(output);
}

async function cancelOrder(args: string[]): Promise<void> {
  const id = args[0];
  if (!id || Number.isNaN(Number(id))) {
    console.error("Usage: order cancel <id>");
    process.exit(1);
  }

  const sql = `UPDATE trade_orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ${Number(id)}`;
  const output = await execD1(sql);
  console.log(`주문 #${id} 취소 완료`);
  if (output.trim()) console.log(output);
}

export async function runOrder(args: string[]): Promise<void> {
  const subcommand = args[0];
  const rest = args.slice(1);

  switch (subcommand) {
    case "add":
      return addOrder(rest);
    case "list":
      return listOrders(rest);
    case "cancel":
      return cancelOrder(rest);
    default:
      console.error("Usage: order <add|list|cancel> [options]");
      console.error("  add    — 주문 추가");
      console.error("  list   — 주문 목록 조회");
      console.error("  cancel — 주문 취소");
      process.exit(1);
  }
}
