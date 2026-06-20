export type EmailTemplateVariable = {
  key: string;
  label: string;
  example: string;
};

export type EmailTemplate = {
  id: string;
  key: string;
  name: string;
  subject: string;
  body_html: string;
  available_variables: EmailTemplateVariable[];
  is_active: boolean;
};

export type EmailTemplatesResponse = {
  data: EmailTemplate[];
};

export type EmailTemplateResponse = {
  data: EmailTemplate;
  message?: string;
};

import type { EmailTheme } from "@/lib/email-theme";

export type EmailPreviewResponse = {
  data: {
    subject: string;
    body_html: string;
    theme?: EmailTheme;
  };
};
