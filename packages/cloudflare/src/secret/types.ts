export type BrokerName = "kis" | "kiwoom";

export function brokerTokenSecretName(broker: BrokerName): string {
  return `broker-token-${broker}`;
}
