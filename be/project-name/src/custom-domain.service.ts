import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { CustomDomain, CustomDomainStatus, VerificationMethod } from './custom-domain.entity';
import * as fs from 'fs';
import * as path from 'path';

const HOSTNAME_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i;

const DOMAINS_FILE = path.join(__dirname, 'domains.json');

@Injectable()
export class CustomDomainService {
  private readonly logger = new Logger(CustomDomainService.name);
  private readonly verificationPrefix = '_sellersstar-verify';
  private readonly domains = new Map<string, CustomDomain>();

  constructor() {
    this.loadDomainsFromFile();
  }

  private loadDomainsFromFile() {
    try {
      if (fs.existsSync(DOMAINS_FILE)) {
        const data = fs.readFileSync(DOMAINS_FILE, 'utf8');
        const domainsArray = JSON.parse(data);
        domainsArray.forEach((domain: CustomDomain) => {
          domain.created_at = new Date(domain.created_at);
          domain.updated_at = new Date(domain.updated_at);
          if (domain.verified_at) {
            domain.verified_at = new Date(domain.verified_at);
          }
          this.domains.set(domain.id, domain);
        });
        this.logger.log(`Loaded ${domainsArray.length} domains from file`);
      }
    } catch (error) {
      this.logger.warn('Failed to load domains from file, starting empty');
    }
  }

  private saveDomainsToFile() {
    try {
      const domainsArray = Array.from(this.domains.values());
      fs.writeFileSync(DOMAINS_FILE, JSON.stringify(domainsArray, null, 2));
      this.logger.log(`Saved ${domainsArray.length} domains to file`);
    } catch (error) {
      this.logger.error('Failed to save domains to file', error);
    }
  }

  async createCustomDomain(dto: {
    hostname: string;
    verification_method?: VerificationMethod;
  }): Promise<CustomDomain> {
    const hostname = dto.hostname
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');

    if (!HOSTNAME_RE.test(hostname)) {
      throw new BadRequestException('Invalid hostname format');
    }

    const existing = Array.from(this.domains.values()).find(
      (d) => d.hostname === hostname,
    );

    if (existing) {
      throw new BadRequestException(`Hostname "${hostname}" is already registered`);
    }

    const verification_token = randomBytes(24).toString('hex');

    const domain: CustomDomain = {
      id: randomBytes(16).toString('hex'),
      hostname,
      status: 'pending',
      verification_token,
      verification_method: dto.verification_method || 'txt',
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.domains.set(domain.id, domain);
    this.saveDomainsToFile();
    return domain;
  }

  async verifyDomain(id: string): Promise<{ ok: boolean; reason?: string }> {
    const domain = this.domains.get(id);

    if (!domain) {
      throw new NotFoundException('Domain not found');
    }

    if (domain.status === 'verified') {
      return { ok: true };
    }

    let ok = false;
    let reason: string | undefined;

    if (domain.verification_method === 'txt' && domain.verification_token) {
      // Simulate TXT verification - in real implementation, check DNS
      ok = await this.checkTxtRecord(domain.hostname, domain.verification_token);
      if (!ok) {
        reason = `TXT record at ${this.verificationPrefix}.${domain.hostname} not found or incorrect`;
      }
    } else if (domain.verification_method === 'file' && domain.verification_token) {
      // Simulate file verification - in real implementation, check HTTP
      ok = await this.checkVerificationFile(domain.hostname, domain.verification_token);
      if (!ok) {
        reason = `Verification file at https://${domain.hostname}/.well-known/sellersstar-verify.txt not found or incorrect`;
      }
    } else {
      reason = 'Verification method not configured';
    }

    if (ok) {
      domain.status = 'verified';
      domain.verified_at = new Date();
      domain.last_error = undefined;
      domain.updated_at = new Date();
      this.saveDomainsToFile();
      return { ok: true };
    } else {
      domain.last_error = reason ?? 'Verification failed';
      domain.updated_at = new Date();
      this.saveDomainsToFile();
      return { ok: false, reason };
    }
  }

  async getDnsInstructions(id: string): Promise<{
    hostname: string;
    status: string;
    verification_token: string;
    verification_method: string;
    instructions: {
      txt_record?: { name: string; type: string; value: string };
      file_verification?: { url: string; content: string };
    };
  }> {
    const domain = this.domains.get(id);

    if (!domain) {
      throw new NotFoundException('Domain not found');
    }

    const instructions: any = {};

    if (domain.verification_method === 'txt' && domain.verification_token) {
      instructions.txt_record = {
        name: `${this.verificationPrefix}.${domain.hostname}`,
        type: 'TXT',
        value: domain.verification_token,
      };
    }

    if (domain.verification_method === 'file' && domain.verification_token) {
      instructions.file_verification = {
        url: `https://${domain.hostname}/.well-known/sellersstar-verify.txt`,
        content: domain.verification_token,
      };
    }

    return {
      hostname: domain.hostname,
      status: domain.status,
      verification_token: domain.verification_token || '',
      verification_method: domain.verification_method || 'txt',
      instructions,
    };
  }

  async listDomains(): Promise<CustomDomain[]> {
    return Array.from(this.domains.values()).sort(
      (a, b) => b.created_at.getTime() - a.created_at.getTime(),
    );
  }

  async getDomain(id: string): Promise<CustomDomain> {
    const domain = this.domains.get(id);
    if (!domain) {
      throw new NotFoundException('Domain not found');
    }
    return domain;
  }

  async deleteDomain(id: string): Promise<void> {
    const domain = this.domains.get(id);
    if (!domain) {
      throw new NotFoundException('Domain not found');
    }
    this.domains.delete(id);
    this.saveDomainsToFile();
  }

  async getVerificationTokenByHostname(hostname: string): Promise<string | null> {
    const domain = Array.from(this.domains.values()).find(
      (d) => d.hostname === hostname.toLowerCase(),
    );
    return domain?.verification_token || null;
  }

  // Simulated verification methods for POC
  private async checkTxtRecord(hostname: string, token: string): Promise<boolean> {
    // In real implementation, check DNS TXT record
    // For POC, just check if we have the token for this hostname (simulating successful TXT verification)
    const domain = Array.from(this.domains.values()).find(
      (d) => d.hostname === hostname.toLowerCase() && d.verification_token === token,
    );
    return !!domain;
  }

  private async checkVerificationFile(hostname: string, token: string): Promise<boolean> {
    // In real implementation, check HTTP file
    // For POC, just check if we have the token for this hostname (simulating successful file verification)
    const domain = Array.from(this.domains.values()).find(
      (d) => d.hostname === hostname.toLowerCase() && d.verification_token === token,
    );
    return !!domain;
  }
}
