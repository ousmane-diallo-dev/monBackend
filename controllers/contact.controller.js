import Contact from '../models/contact.model.js';
import * as mailer from '../services/mailer.service.js';

export const sendMessage = async (req, res, next) => {
  try {
    const { nom, email, sujet, message } = req.body;
    const contact = new Contact({ nom, email, sujet, message });
    await contact.save();
    await mailer.sendMail({
      to: process.env.ADMIN_EMAIL,
      subject: `Nouveau message: ${sujet}`,
      text: `De: ${nom} <${email}>

${message}`,
    });
    res.status(201).json({ message: 'Message envoyé avec succès' });
  } catch (e) { next(e); }
};
