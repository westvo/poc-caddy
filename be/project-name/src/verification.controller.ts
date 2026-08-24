import { Controller, Get, Req } from '@nestjs/common';
import { CustomDomainService } from './custom-domain.service';
import type { Request } from 'express';

@Controller()
export class VerificationController {
  constructor(private readonly customDomainService: CustomDomainService) {}

  @Get('.well-known/sellersstar-verify.txt')
  async getVerificationFile(@Req() req: Request) {
    const host = req.headers.host || '';
    const token = await this.customDomainService.getVerificationTokenByHostname(host);
    if (token) {
      return token;
    }
    return 'Not found';
  }
}
