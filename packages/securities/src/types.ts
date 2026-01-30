export type BrokerEnv = "production" | "dev";

export interface AuthToken {
  token: string;
  tokenType: string;
  expiresAt: Date;
}

export interface AuthClient<TCredentials> {
  getToken(credentials: TCredentials): Promise<AuthToken>;
}
