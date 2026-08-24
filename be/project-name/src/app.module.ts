import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomDomainController } from './custom-domain.controller';
import { CustomDomainService } from './custom-domain.service';
import { VerificationController } from './verification.controller';

@Module({
  imports: [],
  controllers: [AppController, CustomDomainController, VerificationController],
  providers: [AppService, CustomDomainService],
})
export class AppModule {}
