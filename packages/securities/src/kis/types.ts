export interface KisCredentials {
  appkey: string;
  appsecret: string;
}

export interface KisTokenRequest {
  grant_type: string;
  appkey: string;
  appsecret: string;
}

export interface KisTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  access_token_token_expired: string;
}
