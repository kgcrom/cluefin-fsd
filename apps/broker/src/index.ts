import {
  createKisAuthClient,
  createKiwoomAuthClient,
} from "@cluefin/securities";
import type { AuthToken, BrokerEnv } from "@cluefin/securities";
import { brokerTokenSecretName, putSecretToken } from "@cluefin/cloudflare";

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
      throw new Error(
        `잘못된 환경값: "${raw}". "prod" 또는 "dev"를 사용하세요.`,
      );
  }
}

const broker = process.argv[2];

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

const storeId = requireEnv("CLUEFIN_SECRET_STORE_ID");
const name = brokerTokenSecretName(broker as "kis" | "kiwoom");

await putSecretToken({
  storeId,
  name,
  value: token.token,
  remote: true,
});

console.log(`토큰 저장 완료: ${name}`);
