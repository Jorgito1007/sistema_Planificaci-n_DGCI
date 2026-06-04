export function sendMail(params: {
  to: string;
  cc?: string[];
  subject: string;
  html: string;
}): Promise<any>;