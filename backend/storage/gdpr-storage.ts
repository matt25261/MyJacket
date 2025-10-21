import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptPhoneNumber, decryptPhoneNumber, generateQRCode } from '../utils/crypto';

const JACKETS_STORAGE_KEY = '@myjacket_gdpr_jackets';
const STATS_STORAGE_KEY = '@myjacket_gdpr_stats';

export interface GDPRJacket {
  id: string;
  hangerNumber: string;
  encryptedPhoneNumber: string;
  countryCode: string;
  qrCode: string;
  status: 'active' | 'retrieved';
  depositTime: string;
  retrievalTime?: string;
  consentGiven: boolean;
  consentTimestamp: string;
}

export interface AnonymizedStats {
  date: string;
  hour: number;
  deposits: number;
  retrievals: number;
}

export class GDPRStorage {
  static async getAllJackets(): Promise<GDPRJacket[]> {
    try {
      const data = await AsyncStorage.getItem(JACKETS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting jackets:', error);
      return [];
    }
  }

  static async saveJacket(jacket: Omit<GDPRJacket, 'id' | 'encryptedPhoneNumber' | 'qrCode' | 'consentTimestamp'> & { phoneNumber: string }): Promise<GDPRJacket> {
    try {
      const jackets = await this.getAllJackets();
      
      const newJacket: GDPRJacket = {
        id: Date.now().toString(),
        hangerNumber: jacket.hangerNumber,
        encryptedPhoneNumber: encryptPhoneNumber(jacket.phoneNumber),
        countryCode: jacket.countryCode,
        qrCode: generateQRCode(),
        status: jacket.status,
        depositTime: jacket.depositTime,
        retrievalTime: jacket.retrievalTime,
        consentGiven: jacket.consentGiven,
        consentTimestamp: new Date().toISOString(),
      };

      jackets.push(newJacket);
      await AsyncStorage.setItem(JACKETS_STORAGE_KEY, JSON.stringify(jackets));
      
      return newJacket;
    } catch (error) {
      console.error('Error saving jacket:', error);
      throw error;
    }
  }

  static async updateJacket(id: string, updates: Partial<GDPRJacket>): Promise<void> {
    try {
      const jackets = await this.getAllJackets();
      const index = jackets.findIndex(j => j.id === id);
      
      if (index === -1) {
        throw new Error('Jacket not found');
      }

      jackets[index] = { ...jackets[index], ...updates };
      await AsyncStorage.setItem(JACKETS_STORAGE_KEY, JSON.stringify(jackets));
    } catch (error) {
      console.error('Error updating jacket:', error);
      throw error;
    }
  }

  static async getJacketByQR(qrCode: string): Promise<GDPRJacket | null> {
    try {
      const jackets = await this.getAllJackets();
      return jackets.find(j => j.qrCode === qrCode) || null;
    } catch (error) {
      console.error('Error getting jacket by QR:', error);
      return null;
    }
  }

  static async deleteJacket(id: string): Promise<void> {
    try {
      const jackets = await this.getAllJackets();
      const filtered = jackets.filter(j => j.id !== id);
      await AsyncStorage.setItem(JACKETS_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting jacket:', error);
      throw error;
    }
  }

  static async deleteExpiredJackets(): Promise<number> {
    try {
      const jackets = await this.getAllJackets();
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const toAnonymize: GDPRJacket[] = [];
      const toKeep: GDPRJacket[] = [];

      for (const jacket of jackets) {
        const depositDate = new Date(jacket.depositTime);
        if (depositDate < sevenDaysAgo) {
          toAnonymize.push(jacket);
        } else {
          toKeep.push(jacket);
        }
      }

      if (toAnonymize.length > 0) {
        await this.anonymizeJackets(toAnonymize);
        await AsyncStorage.setItem(JACKETS_STORAGE_KEY, JSON.stringify(toKeep));
      }

      return toAnonymize.length;
    } catch (error) {
      console.error('Error deleting expired jackets:', error);
      return 0;
    }
  }

  static async anonymizeJackets(jackets: GDPRJacket[]): Promise<void> {
    try {
      const existingStats = await this.getAnonymizedStats();

      for (const jacket of jackets) {
        const depositDate = new Date(jacket.depositTime);
        const dateKey = depositDate.toISOString().split('T')[0];
        const hour = depositDate.getHours();

        let statEntry = existingStats.find(s => s.date === dateKey && s.hour === hour);
        if (!statEntry) {
          statEntry = { date: dateKey, hour, deposits: 0, retrievals: 0 };
          existingStats.push(statEntry);
        }

        statEntry.deposits += 1;

        if (jacket.retrievalTime) {
          const retrievalDate = new Date(jacket.retrievalTime);
          const retrievalDateKey = retrievalDate.toISOString().split('T')[0];
          const retrievalHour = retrievalDate.getHours();

          let retrievalStatEntry = existingStats.find(s => s.date === retrievalDateKey && s.hour === retrievalHour);
          if (!retrievalStatEntry) {
            retrievalStatEntry = { date: retrievalDateKey, hour: retrievalHour, deposits: 0, retrievals: 0 };
            existingStats.push(retrievalStatEntry);
          }

          retrievalStatEntry.retrievals += 1;
        }
      }

      await AsyncStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(existingStats));
    } catch (error) {
      console.error('Error anonymizing jackets:', error);
    }
  }

  static async getAnonymizedStats(): Promise<AnonymizedStats[]> {
    try {
      const data = await AsyncStorage.getItem(STATS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting anonymized stats:', error);
      return [];
    }
  }

  static async getDecryptedPhoneNumber(encryptedPhoneNumber: string): Promise<string> {
    try {
      return decryptPhoneNumber(encryptedPhoneNumber);
    } catch (error) {
      console.error('Error decrypting phone number:', error);
      throw error;
    }
  }
}
