//Vacation E-mail auto response app.

const nodemailer = require('nodemailer');
const {google} = require('googleapis');
//We will use two libraries for the application nodemailer and googleapis.

/*The CLIENT_ID, CLIENT_SECRET, REDIRECT_URI, REFRESH_TOKEN can be 
obtained through :
1. Visit https://console.cloud.google.com/ 
2. Create a New Project and Select the project
3. Go to Navigation Menu -> APIs & Services -> OAuth Consent screen and set User type as External, then in test users add the email by which we have been logged in.
4. In same APIs & Services Menu, go to credentials and click on Create Credentials and select OAuth client ID
5. Select Application type as 'Web Application', set App Name and set Authorized redirect URIs to https://developers.google.com/oauthplayground and click on Create. Client ID and Client secret will be generated
6. Visit https://developers.google.com/oauthplayground. In top right corner, select settings icon and check Use your own OAuth credentials
7. Input your Client ID and Client secret and close the tab.
8. In left corner, set 'Input your own scopes' as https://mail.google.com and then click on Authorize APIs.
9. Now select your gmail ID to sign in and allow all necessary permissions, and you will get authorization code
10. Now we can exchange the authorization code for Refresh and Access Token and use it in our application.
*/
const CLIENT_ID = '567670850798-m3efcjkg8s9cofkh7euvf0hhogpmmb9j.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//0489ZQhr6bUq2CgYIARAAGAQSNwF-L9IrSKbOk6WOpMzRO8yDLS_Efchh2G7AvMsOKpej7j1zIFQuynuYRrDhIwLmvVV_uyTgv84';
const user = 'sanishnirwan@gmail.com'; //User email of Responder.

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID,CLIENT_SECRET,REDIRECT_URI); //Creating Auth client object by passing credentials.
oAuth2Client.setCredentials({refresh_token : REFRESH_TOKEN});

const setResponder = async () =>{ //The main function is set as aync since it involves API calls that may lead to unwanted and asynchronous behaviour in our application.
    try{
    const ACCESS_TOKEN = await oAuth2Client.getAccessToken(); //Fetching the access-token on spot when we need it as it gets refreshed in every 3600 seconds.
    const gmail = google.gmail({ //Setting up gmail service
        version : 'v1',
        auth : oAuth2Client
    });

    const transport = nodemailer.createTransport({ //Creating a nodemailer transport to send mails
        host : 'imap.gmail.com',
        port : 993,
        requireTLS : true,
        tls : {
            rejectUnauthorized : false
        },
        service : 'gmail',
        auth : {
            type : 'OAuth2',
            user : user,
            clientId : CLIENT_ID,
            clientSecret : CLIENT_SECRET,
            refreshToken : REFRESH_TOKEN,
            accessToken : ACCESS_TOKEN
        }
    });

    const mailOptions = { //Setting mail options configuration, with message to the sender of email.
        to : user,
        subject : 'Vacation Responder',
        text : 'Dear Sender, I am currently on vacations and wont be able to response for few days',
        html : '<h2>Dear Sender, I am currently on vacations and wont be able to response for few days.</h2>'
    };

    gmail.users.labels.get({ //Getting the label if it already exists
            userId : 'me',
            id : '100'
    },(err)=>{ // If the label doesn't exists, we will create a label with id as 100
        if(err){
            gmail.users.labels.create({
                userId : 'me',
                requestBody : {
                    labelListVisibility : 'labelShow',
                    messageListVisibility : 'show',
                    name : 'Label1',
                    id : '100',
                    type : 'user'
                }
            }, (err) => {
                if (err) {
                    console.error(err);
                }
            });
        }
    });


    gmail.users.settings.updateVacation({ //Setting up vacation responder configuration
        userId : 'me',
        requestBody : {
            enableAutoReply : true,
            responseSubject : mailOptions.subject,
            responseBodyHtml : mailOptions.html,
            restrictToDomain : false,
            restrictToContacts : false,
            startTime : Date.now(),
            endTime : Date.now() + (1000 * 3600 * 24 * 7) //Setting up vacation time for 7 days.
        }
    });

    const result = await transport.sendMail(mailOptions); //Calling sendMail function for sending the response whenever we get a new message.
    return result;
  } catch (err){
    return err;
  }
}

setInterval(setResponder().then((res)=>{console.log("Responder set up successfully! ");}).catch((err)=>{console.error(`Found an error while setting up responder : ${err}`);}), 1000 * 45);
// Calling the responder function every 45 seconds in order to check for new mails.

/*
  Note : [Areas where code can be improved]
  When the application is started it, the responder function is called every 45 seconds, 
  which would run for indefinite time and needs to stop abruptly by clicking Ctrl+C in terminal. 
  Thus, it needs a fix.
*/