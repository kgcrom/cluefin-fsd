import path from "node:path";
import type { AuthToken, BrokerEnv } from "@cluefin/securities";
import { createKisAuthClient, createKiwoomAuthClient } from "@cluefin/securities";

const PROJECT_ROOT_DIR = path.resolve(import.meta.dir, "../../..");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`환경변수 ${name}이(가) 설정되지 않았습니다.`);
  }
  return value;
}

function parseBrokerEnv(raw: string): BrokerEnv {
  switch (raw) {
    case "prod":
      return "production";
    case "dev":
      return "dev";
    default:
      throw new Error(`잘못된 환경값: "${raw}". "prod" 또는 "dev"를 사용하세요.`);
  }
}

const args = process.argv.slice(2);
const broker = args.find((a) => !a.startsWith("--"));

if (!broker || !["kis", "kiwoom"].includes(broker)) {
  console.error("Usage: bun run src/index.ts <kis|kiwoom>");
  process.exit(1);
}

let token: AuthToken;

if (broker === "kis") {
  const env = parseBrokerEnv(requireEnv("KIS_ENV"));
  const client = createKisAuthClient(env);
  token = await client.getToken({
    appkey: requireEnv("KIS_APP_KEY"),
    appsecret: requireEnv("KIS_SECRET_KEY"),
  });
} else {
  const env = parseBrokerEnv(requireEnv("KIWOOM_ENV"));
  const client = createKiwoomAuthClient(env);
  token = await client.getToken({
    appkey: requireEnv("KIWOOM_APP_KEY"),
    secretkey: requireEnv("KIWOOM_SECRET_KEY"),
  });
}

console.log(`토큰 발급 완료: ${token.token.substring(0, 20)}...`);

const secretKey = broker === "kis" ? "BROKER_TOKEN_KIS" : "BROKER_TOKEN_KIWOOM";
const tokenValue = JSON.stringify(token);

console.log(`wrangler secret put ${secretKey} 실행 중...`);

const proc = Bun.spawn(
  [
    "bunx",
    "wrangler",
    "secret",
    "put",
    secretKey,
    "--config",
    path.join(PROJECT_ROOT_DIR, "apps/trader/wrangler.jsonc"),
  ],
  {
    stdin: "pipe",
    stdout: "inherit",
    stderr: "inherit",
  },
);

proc.stdin.write(tokenValue);
proc.stdin.end();

const exitCode = await proc.exited;

if (exitCode !== 0) {
  console.error(`wrangler secret put 실패 (exit code: ${exitCode})`);
  process.exit(1);
}

console.log(`${secretKey} 시크릿 저장 완료`);
