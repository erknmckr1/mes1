// services/mailService.js
const transporter = require('./mailConfig');
const dotenv = require('dotenv')
dotenv.config();

const sendMail = async (to, subject, text) => {
  const mailOptions = {
    from : process.env.EMAIL_SENDER, 
    to: to,
    subject: subject,
    text: text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Mail başarıyla gönderildi.');
  } catch (error) {
    console.error('Mail gönderim hatası:', error);
  }
};

module.exports = sendMail;
