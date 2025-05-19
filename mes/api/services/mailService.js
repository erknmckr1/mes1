// services/mailService.js
const transporter = require('./mailConfig');
const dotenv = require('dotenv');
dotenv.config();

/**
 * 
 * @param {string} to - Alıcı mail adresi
 * @param {string} subject - Mail konusu
 * @param {string} htmlContent - HTML içerik
 * @param {string|null} attachmentPath - Excel dosya yolu (opsiyonel)
 */
const sendMail = async (to, subject, htmlContent, attachmentPath = null) => {
  const mailOptions = {
    from: process.env.EMAIL_SENDER,
    to,
    subject,
    html: htmlContent,
    attachments: [],
  };

  if (attachmentPath) {
    mailOptions.attachments.push({
      filename: "export.xlsx",
      path: attachmentPath,
    });
  }

  try {
    await transporter.sendMail(mailOptions);
    console.log('📤 Mail başarıyla gönderildi.');
  } catch (error) {
    console.error('❌ Mail gönderim hatası:', error);
  }
};

module.exports = sendMail;
