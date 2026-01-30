import {
  createKisAuthClient,
  createKiwoomAuthClient,
} from "@cluefin/securities";
import type { BrokerEnv } from "@cluefin/securities";

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
    case "mock":
      return "mock";
    default:
      throw new Error(
        `잘못된 환경값: "${raw}". "prod" 또는 "mock"을 사용하세요.`,
      );
  }
}

const broker = process.argv[2];

if (!broker || !["kis", "kiwoom"].includes(broker)) {
  console.error("Usage: bun run src/index.ts <kis|kiwoom>");
  process.exit(1);
}

if (broker === "kis") {
  const env = parseBrokerEnv(requireEnv("KIS_ENV"));
  const client = createKisAuthClient(env);
  const token = await client.getToken({
    appkey: requireEnv("KIS_APP_KEY"),
    appsecret: requireEnv("KIS_SECRET_KEY"),
  });
  console.log(token);
} else {
  const env = parseBrokerEnv(requireEnv("KIWOOM_ENV"));
  const client = createKiwoomAuthClient(env);
  const token = await client.getToken({
    appkey: requireEnv("KIWOOM_APP_KEY"),
    secretkey: requireEnv("KIWOOM_SECRET_KEY"),
  });
  console.log(token);
}
