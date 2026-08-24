export type CustomDomainStatus = 'pending' | 'verified' | 'failed';
export type VerificationMethod = 'txt' | 'file';

export class CustomDomain {
  id: string;
  hostname: string;
  status: CustomDomainStatus;
  verification_token?: string;
  verification_method?: VerificationMethod;
  verified_at?: Date;
  last_error?: string;
  created_at: Date;
  updated_at: Date;
}
