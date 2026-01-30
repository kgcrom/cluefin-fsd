export interface KiwoomCredentials {
  appkey: string;
  secretkey: string;
}

export interface KiwoomTokenRequest {
  grant_type: string;
  appkey: string;
  secretkey: string;
}

export interface KiwoomTokenResponse {
  expires_dt: string;
  token_type: string;
  token: string;
}
