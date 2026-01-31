export type BrokerName = "kis" | "kiwoom";

export function brokerTokenSecretName(broker: BrokerName): string {
  return `BROKER_TOKEN_${broker.toUpperCase()}`;
}
