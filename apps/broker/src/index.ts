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

console.log(`토큰 발급 완료: ${token.token.substring(0, 10)}...`);

const devVarsPath = path.join(PROJECT_ROOT_DIR, "apps/trader/.dev.vars");
const wranglerConfig = path.join(PROJECT_ROOT_DIR, "apps/trader/wrangler.jsonc");

async function putSecret(key: string, value: string): Promise<void> {
  console.log(`wrangler secret put ${key} 실행 중...`);

  const proc = Bun.spawn(["bunx", "wrangler", "secret", "put", key, "--config", wranglerConfig], {
    stdin: "pipe",
    stdout: "inherit",
    stderr: "inherit",
  });

  proc.stdin.write(value);
  proc.stdin.end();

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    console.error(`wrangler secret put ${key} 실패 (exit code: ${exitCode})`);
    process.exit(1);
  }
  console.log(`${key} 시크릿 저장 완료`);
}

async function upsertDevVar(key: string, value: string): Promise<void> {
  const devVarsFile = Bun.file(devVarsPath);
  const devVarsExists = await devVarsFile.exists();

  let lines: string[] = [];
  if (devVarsExists) {
    const content = await devVarsFile.text();
    lines = content.split("\n");
  }

  const prefix = `${key}=`;
  const newLine = `${prefix}${value}`;
  const idx = lines.findIndex((l) => l.startsWith(prefix));

  if (idx >= 0) {
    lines[idx] = newLine;
  } else {
    if (lines.length > 0 && lines[lines.length - 1] === "") {
      lines.splice(lines.length - 1, 0, newLine);
    } else {
      lines.push(newLine);
    }
  }

  await Bun.write(devVarsPath, lines.join("\n"));
  console.log(`.dev.vars에 ${key} 저장 완료`);
}

async function saveSecret(key: string, value: string): Promise<void> {
  await putSecret(key, value);
  await upsertDevVar(key, value);
}

const tokenKey = broker === "kis" ? "BROKER_TOKEN_KIS" : "BROKER_TOKEN_KIWOOM";
await saveSecret(tokenKey, token.token);

if (broker === "kis") {
  await saveSecret("KIS_APP_KEY", requireEnv("KIS_APP_KEY"));
  await saveSecret("KIS_SECRET_KEY", requireEnv("KIS_SECRET_KEY"));
} else {
  await saveSecret("KIWOOM_APP_KEY", requireEnv("KIWOOM_APP_KEY"));
  await saveSecret("KIWOOM_SECRET_KEY", requireEnv("KIWOOM_SECRET_KEY"));
}
