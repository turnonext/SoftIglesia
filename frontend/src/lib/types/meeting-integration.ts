export type ZoomIntegrationStatus = {
  configured: boolean;
  is_enabled: boolean;
  verified_at: string | null;
  account_id: string | null;
  client_id: string | null;
  has_client_secret: boolean;
};

export type MeetIntegrationStatus = {
  configured: boolean;
  is_enabled: boolean;
  verified_at: string | null;
  client_id: string | null;
  has_client_secret: boolean;
  has_refresh_token: boolean;
  calendar_id: string;
};

export type MeetingIntegrationsResponse = {
  data: {
    zoom: ZoomIntegrationStatus;
    meet: MeetIntegrationStatus;
  };
};
