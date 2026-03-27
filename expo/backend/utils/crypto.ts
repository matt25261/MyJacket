import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'myjacket-default-key-change-in-production-32bytes';
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

export function encryptPhoneNumber(phoneNumber: string): string {
  try {
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'utf-8');
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(phoneNumber, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Error encrypting phone number:', error);
    throw error;
  }
}

export function decryptPhoneNumber(encryptedData: string): string {
  try {
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32), 'utf-8');
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting phone number:', error);
    throw error;
  }
}

export function hashPhoneNumber(phoneNumber: string): string {
  const salt = 'myjacket-salt-change-in-production';
  return crypto
    .createHash('sha256')
    .update(phoneNumber + salt)
    .digest('hex');
}

export function generateQRCode(): string {
  return `MYJACKET-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
}
