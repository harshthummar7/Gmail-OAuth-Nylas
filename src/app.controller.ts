import { Controller, Get, Req, Res, Query, Body, Post, Redirect } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';
import { RedisService } from 'nestjs-redis';
import { Scope } from 'nylas/lib/models/connect';
import * as dotenv from 'dotenv' 
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';


const Nylas = require('nylas');
dotenv.config()

Nylas.config({                             //configuration of nylas
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
});

@Controller()
export class AppController {
 
  private data: any;

  constructor(private readonly appService: AppService,private readonly redisService: RedisService,private readonly httpService:HttpService) { }

  @Post()
  async start(@Req() req,@Res() res:Response){
          if(req.body.data){
            console.log(req.body.data)
            this.data = req.body.data
            res.redirect('connect')
          }
  
  }

  @Get('connect')
  async connect(@Res() res: Response,@Req() req) {
       
          const options = {
            loginHint: this.data,
            redirectURI: process.env.REDIRECT_URL,
            scopes: [Scope.EmailReadOnly, Scope.EmailSend,Scope.EmailDrafts],           //scope of email which are access
          };
         
          const ans = await Nylas.urlForAuthentication(options)
          const regx = /client_id=(([a-z0-9]+))/gm.exec(ans)           //regular expression for fetching client_id 
          const client_id = (regx[0].split('=')[1])
          
          res.cookie('client_id', client_id);                          //set client_id in cookie

          res.redirect(await Nylas.urlForAuthentication(options));     //after authentication redirect to the callback url
  }



  @Get('oauth/callback')
  async callback(@Query('code') code: string, @Query('error') error: string,@Req() req: Request,@Res() res: Response) {


        const client_id = req['cookies'].client_id 
        const redisClient = this.redisService.getClient();
        //await redisClient.del(`${client_id}`)                  //just delete client in redis for check time for get token in nylas
        const tokenExists = await redisClient.get(`${client_id}`)
        

        if(tokenExists)
        {
           console.time('Redis')
          const token = await JSON.parse(tokenExists)
          console.log(token.email_address)
          const tkn = {accessToken:token.access_token,emailAddress:token.email_address}
           console.timeEnd('Redis')

          await res.send({message:"token send"})
          const response =  await this.httpService.post(process.env.NGROK_URL,{token:tkn});
          await firstValueFrom(response);
          return
    
        }
          
        
        
        if (code) {
          
            try {
              console.time('Nylas')
              const token = await Nylas.exchangeCodeForToken(code);      //get token details from nylas 
              console.timeEnd('Nylas')

              const tkn = {accessToken:token.accessToken,emailAddress:token.emailAddress}
              const redisClient = this.redisService.getClient();
              await redisClient.set(`${client_id}`,token)            
              
  
              await res.send({message:"token send"})
              const response =  await this.httpService.post(process.env.NGROK_URL,{token:tkn});    
              await firstValueFrom(response);

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

  @Post('sendMail')
  async sendMail(@Req() req:Request,@Res() res:Response)
  {
     const msg = await this.appService.sendEmail(req.body)
     console.log(msg)
     const response =  await this.httpService.post(`${process.env.NGROK_URL}/getmessage`,msg);    //send confirmation message to other machine
     await firstValueFrom(response);
    
  }

  @Post('getMails')
  async draftMail(@Req() req:Request,@Res() res:Response)
  {
    const msg = await this.appService.getEmails(req.body)
    const response =  await this.httpService.post(`${process.env.NGROK_URL}/getsubarr`,msg);     //send emial list to other machine
    await firstValueFrom(response);
    
  }

  @Post('saveDraft')
  async saveDraft(@Req() req:Request,@Res() res:Response)
  {
    const msg = await this.appService.saveDraft(req.body)
    const response =  await this.httpService.post(`${process.env.NGROK_URL}/getdraftmsg`,msg);    //send confirmation message for save draft to other machine
    await firstValueFrom(response);
    
  }
}
