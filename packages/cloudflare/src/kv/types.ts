import type { AuthToken } from "@cluefin/securities";

export interface KvAuthToken {
  token: string;
  tokenType: string;
  expiresAt: string;
}

export type BrokerName = "kis" | "kiwoom";

export function brokerTokenKey(broker: BrokerName): string {
  return `broker:token:${broker}`;
}

export function serializeAuthToken(token: AuthToken): KvAuthToken {
  return {
    token: token.token,
    tokenType: token.tokenType,
    expiresAt: token.expiresAt.toISOString(),
  };
}
