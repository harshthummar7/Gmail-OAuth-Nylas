import { Controller, Get, Req, Res, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { RedisService } from 'nestjs-redis';
import { Scope } from 'nylas/lib/models/connect';

import * as dotenv from 'dotenv' 
const Nylas = require('nylas');
dotenv.config()
Nylas.config({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
});

@Controller()
export class AppController {
  getHello(): any {
    throw new Error('Method not implemented.');
  }
 
  constructor(private readonly appService: AppService,private readonly redisService: RedisService) { }

  @Get()
  async connect(@Res() res: Response) {
  
          const options = {
            redirectURI: process.env.REDIRECT_URL,
            scopes: [Scope.EmailReadOnly, Scope.EmailSend,Scope.EmailDrafts],
          };
        
          const ans = await Nylas.urlForAuthentication(options)
          
          const regx = /client_id=(([a-z0-9]+))/gm.exec(ans)
          const client_id = (regx[0].split('=')[1])
          
          res.cookie('client_id', client_id);

          res.redirect(await Nylas.urlForAuthentication(options));
  }



  @Get('oauth/callback')
  async callback(@Query('code') code: string, @Query('error') error: string,@Req() req: Request) {


        const client_id = req['cookies'].client_id 
        const redisClient = this.redisService.getClient();
        await redisClient.del(`${client_id}`)       //just delete client in redis for check time to get token in nylas
        console.time('Redis')
        const tokenExists = await redisClient.get(`${client_id}`)
        
        if(tokenExists)
        {
          const token = await JSON.parse(tokenExists)
          const tkn = {accessToken:token.access_token,emailAddress:token.email_address}
      
          console.log(1)
          console.timeEnd('Redis')
          return this.appService.sendEmail(tkn);
        }
        
        if (code) {
          
            try {
              console.time('Nylas')
              const token = await Nylas.exchangeCodeForToken(code);
              const redisClient = this.redisService.getClient();
              await redisClient.set(`${client_id}`,token)
              console.timeEnd('Nylas')
              return this.appService.sendEmail(token);
              
              //return this.appService.getEmails(token);
              //return this.appService.saveDraft(token);

            } 
            catch (err) {
                return {message:"token not get"}
            }
          } 
          
        else if(error) 
          {
            return {message:"code not get"}
          }
  }

}
