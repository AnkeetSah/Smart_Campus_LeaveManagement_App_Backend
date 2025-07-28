import crypto from 'crypto';

export const generatePassword = (name, email) => {
  const firstName = name.split(' ')[0].toLowerCase();
  const emailPrefix = email.split('@')[0].toLowerCase(); // part before @
  const randomHex = crypto.randomBytes(3).toString('hex');
  
  return `${firstName}_${emailPrefix}_${randomHex}`;
};
