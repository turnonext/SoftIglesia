export type CertificateVariable = {
  key: string;
  label: string;
  example: string;
};

export type CertificateSignatureSlot = {
  slot: number;
  enabled: boolean;
  name: string;
  title: string;
  has_image: boolean;
};

export type CertificateTemplate = {
  id: string;
  key: string;
  name: string;
  body_html: string;
  available_variables: CertificateVariable[];
  is_system: boolean;
  is_active: boolean;
  updated_at?: string;
};

export type CertificateTemplatesResponse = {
  data: CertificateTemplate[];
  variables: CertificateVariable[];
  system_keys: string[];
};

export type CertificateSignaturesResponse = {
  data: CertificateSignatureSlot[];
};

export const EMPTY_SIGNATURES: CertificateSignatureSlot[] = [
  { slot: 1, enabled: true, name: "", title: "", has_image: false },
  { slot: 2, enabled: false, name: "", title: "", has_image: false },
  { slot: 3, enabled: false, name: "", title: "", has_image: false },
];
