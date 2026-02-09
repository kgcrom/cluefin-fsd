import type { AuthToken } from "@cluefin/securities";
import { createKisAuthClient, createKiwoomAuthClient } from "@cluefin/securities";
import { DEV_VARS_PATH, parseBrokerEnv, requireEnv, WRANGLER_CONFIG } from "../utils";

async function putSecret(key: string, value: string): Promise<void> {
  console.log(`wrangler secret put ${key} 실행 중...`);

  const proc = Bun.spawn(["bunx", "wrangler", "secret", "put", key, "--config", WRANGLER_CONFIG], {
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
  const devVarsFile = Bun.file(DEV_VARS_PATH);
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

  await Bun.write(DEV_VARS_PATH, lines.join("\n"));
  console.log(`.dev.vars에 ${key} 저장 완료`);
}

async function saveSecret(key: string, value: string): Promise<void> {
  await putSecret(key, value);
  await upsertDevVar(key, value);
}

// TODO: broker에서 토큰 발급하는게 아니라 cloudflare cron으로 실행
export async function runToken(broker: string): Promise<void> {
  if (!["kis", "kiwoom"].includes(broker)) {
    console.error("Usage: bun run src/index.ts token <kis|kiwoom>");
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

  const tokenKey = broker === "kis" ? "BROKER_TOKEN_KIS" : "BROKER_TOKEN_KIWOOM";
  await saveSecret(tokenKey, token.token);

  if (broker === "kis") {
    await saveSecret("KIS_APP_KEY", requireEnv("KIS_APP_KEY"));
    await saveSecret("KIS_SECRET_KEY", requireEnv("KIS_SECRET_KEY"));
    await saveSecret("KIS_ACCOUNT_NO", requireEnv("KIS_ACCOUNT_NO"));
    await saveSecret("KIS_ACCOUNT_PRODUCT_CODE", requireEnv("KIS_ACCOUNT_PRODUCT_CODE"));
  } else {
    await saveSecret("KIWOOM_APP_KEY", requireEnv("KIWOOM_APP_KEY"));
    await saveSecret("KIWOOM_SECRET_KEY", requireEnv("KIWOOM_SECRET_KEY"));
  }
}
