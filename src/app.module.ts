import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { RedisModule } from 'nestjs-redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GoogleStrategy } from './google-strategy';

@Module({
  imports:[HttpModule,RedisModule.register({
    url:'redis://localhost:6379',
  })],
  controllers: [AppController],
  providers: [AppService,GoogleStrategy],
})
export class AppModule {}
