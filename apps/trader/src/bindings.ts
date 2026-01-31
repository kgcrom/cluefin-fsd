export interface Env {
  KIS_APP_KEY: string;
  KIS_SECRET_KEY: string;
  KIS_ENV: string;
  SECRETS_STORE: {
    get(name: string): Promise<string | null>;
  };
}
