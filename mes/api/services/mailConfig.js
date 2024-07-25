const nodemailer = require("nodemailer");
const dotenv = require('dotenv')
dotenv.config();

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE, // Kullanılan e posta sağlayııcsı...
    auth: {
      user : process.env.EMAIL_USERNAME,
      pass : process.env.EMAIL_PASSWORD
    }
  });
  
  module.exports = transporter;