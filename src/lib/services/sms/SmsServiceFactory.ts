import { ISmsProvider } from "./ISmsProvider";
import { NotifyLKSmsProvider } from "./NotifyLKSmsProvider";

export class SmsServiceFactory {
  static getProvider(): ISmsProvider {
    // Easily switch providers based on environment variables for Open-Closed Principle
    // if (process.env.SMS_PROVIDER === 'TWILIO') return new TwilioSmsProvider();
    
    return new NotifyLKSmsProvider();
  }
}
