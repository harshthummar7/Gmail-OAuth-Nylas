import { BadRequestException, Injectable, Scope } from '@nestjs/common';
import Draft from 'nylas/lib/models/draft';
import * as dotenv from 'dotenv' 


dotenv.config()
const Nylas = require('nylas');
Nylas.config({                                         //configuration of nylas
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
});



@Injectable()
export class AppService {

  
  constructor(){}

  async sendEmail(options) {                            // sending email to specific user using nylas api
    try{
  
        const nylas = await Nylas.with(options.token);
        
        const draft = new Draft(nylas, {
            subject: options.mailbody.subject,
            body: options.mailbody.body,
            to: [{ email:options.mailbody.to}]
         });
        
         draft.send().then(account => console.log("ok"));
         console.log("done")
         return({message:"Email is Send"})
    }
    catch(err)
    {
      console.log(err)
        throw new BadRequestException("Email is not send")
    }

  }
  async getEmails(options){                                 // getting emails to specific user using nylas api
    try{
    
      const nylas = await Nylas.with(options.token);
      const arr = []
      const emails = await nylas.threads.list({ limit:options.limit });
      for (let email of emails) {
        
        arr.push(email.subject)
      }
      return {message:"Received Emails",arr}
      
    }
    catch(err){
      console.log(err)
      return {message:"Emails not Received"}
    }
    
  }

 async saveDraft(options)                                       //email save into draft for specific user using nylas api
  {
  
    const nylas = await Nylas.with(options.token);

    const draft = new Draft(nylas, {
          subject: options.mailbody.subject,
          body: options.mailbody.body,
          to: [{ email: options.mailbody.to }],
      });

    try{
      await draft.save();
      return {message:"successfully draft save"};
    }

    catch (err) {
      console.log(err)
          return {message:"draft not save"};
      }
  }

}