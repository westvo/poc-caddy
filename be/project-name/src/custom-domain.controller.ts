import { Controller, Get, Post, Body, Param, HttpCode, Req } from '@nestjs/common';
import { CustomDomainService } from './custom-domain.service';
import { VerificationMethod } from './custom-domain.entity';
import type { Request } from 'express';

@Controller('custom-domains')
export class CustomDomainController {
  constructor(private readonly customDomainService: CustomDomainService) {}

  @Post()
  @HttpCode(201)
  async createCustomDomain(@Body() body: {
    hostname: string;
    verification_method?: VerificationMethod;
  }) {
    return await this.customDomainService.createCustomDomain(body);
  }

  @Post(':id/verify')
  @HttpCode(200)
  async verifyDomain(@Param('id') id: string) {
    return await this.customDomainService.verifyDomain(id);
  }

  @Get(':id/dns-instructions')
  async getDnsInstructions(@Param('id') id: string, @Req() req: Request) {
    const result = await this.customDomainService.getDnsInstructions(id);
    
    // Get server IP - use the actual Docker network IP or fallback to localhost
    let serverIp = req.socket.remoteAddress || req.headers['x-forwarded-for'] as string || 'localhost';
    
    // Handle IPv6 addresses (::ffff:x.x.x.x) -> extract IPv4
    if (serverIp.startsWith('::ffff:')) {
      serverIp = serverIp.replace('::ffff:', '');
    }
    
    // For Docker network, use localhost for display
    if (serverIp.startsWith('172.') || serverIp.startsWith('10.') || serverIp.startsWith('192.168.')) {
      serverIp = 'localhost';
    }
    
    return {
      ...result,
      server_ip: serverIp
    };
  }

  @Get()
  async listDomains() {
    return await this.customDomainService.listDomains();
  }

  @Get(':id')
  async getDomain(@Param('id') id: string) {
    return await this.customDomainService.getDomain(id);
  }
}
