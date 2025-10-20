
import nodemailer from "nodemailer"


const sendEmail = async (option) =>{
// create transporter


const transporter = nodemailer.createTransport({
    // host: process.env.EMAIL_HOST,
    // PORT: process.env.EMAIL_PORT,
    // auth:{
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASSWORD
    // } 
    service: 'gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth:{
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
       
    },
})

console.log("hello transporter",process.env.EMAIL_USER);
    // define email options

    const emailOptions ={
        // from: 'Logime support<support@logime.com',
        // to: option.email,
        // subject: option.subject,
        // text: option.message,

        from:{
            name: "DEVMAINT",
            address: 'evrardmodi.mesn@gmail.com'
        },
        to: option.email,
        subject: option.subject,
        text: option.message

    }
    
    const sendMail = async (transporter,emailOptions)=>{
        try {
            await transporter.sendMail(emailOptions);
            console.log("Email has been sent");
            
        } catch (error) {
            console.error('here is the error', error);
        }
    }
    sendMail(transporter,emailOptions)
    
}

export default sendEmail