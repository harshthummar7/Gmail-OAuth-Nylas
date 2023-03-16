import { BadRequestException, Injectable, Scope } from '@nestjs/common';
import Draft from 'nylas/lib/models/draft';
import * as dotenv from 'dotenv' 


dotenv.config()
const Nylas = require('nylas');
Nylas.config({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
});



@Injectable()
export class AppService {

  
  constructor(){}

 async sendEmail(token) {
    try{
  
        const nylas = await Nylas.with(token.accessToken);
        
        const draft = new Draft(nylas, {
            subject: "With Love, from PCH1",
            body: 'This email was sent using the Nylas email API.',
            to: [{ email:token.emailAddress}]
         });
        
         draft.send().then(account => console.log("ok"));
         
         return({message:"Email is Send"})
    }
    catch(err)
    {
      console.log(err)
        throw new BadRequestException("Email is not send")
    }

  }
  async getEmails(token){
    try{
    
      const nylas = await Nylas.with(token.accessToken);
      
      const emails = await nylas.threads.list({ limit:5 });
      for (let email of emails) {
        console.log(email.subject);
      }
      return {message:"Received Emails"}
      
    }
    catch(err){
      console.log(err)
      return {message:"Emails not Received"}
    }
    
  }

 async saveDraft(token)
  {
  
    const nylas = await Nylas.with(token.accessToken);

    const draft = new Draft(nylas, {
          subject: "With Love, from PCH and Save in Draft",
          body: "Hey there, I am saving this email draft using Nylas.",
          to: [{ email: token.emailAddress }],
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