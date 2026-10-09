import { ISmsProvider } from "./ISmsProvider";

export class NotifyLKSmsProvider implements ISmsProvider {
  private userId: string;
  private apiKey: string;
  private senderId: string;

  constructor() {
    this.userId = process.env.NOTIFY_USER_ID || "33277";
    this.apiKey = process.env.NOTIFY_API_KEY || "t9y5P2zdTTPXWlo8z4DZ";
    this.senderId = process.env.NOTIFY_SENDER_ID || "NotifyDEMO";
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    try {
      let toPhone = to.trim();
      if (toPhone.startsWith('0')) {
        toPhone = '94' + toPhone.substring(1);
      } else if (toPhone.startsWith('+94')) {
        toPhone = toPhone.substring(1);
      }

      const notifyUrl = `https://app.notify.lk/api/v1/send`;
      const formData = new URLSearchParams({
        user_id: this.userId,
        api_key: this.apiKey,
        sender_id: this.senderId,
        to: toPhone,
        message: message
      });

      const notifyRes = await fetch(notifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      if (notifyRes.ok) {
        const resData = await notifyRes.json();
        if (resData.status === "success") {
          return true;
        } else {
          console.error(`Notify.lk API Error for ${toPhone}:`, resData);
          return false;
        }
      } else {
        const errData = await notifyRes.text();
        console.error(`Notify.lk HTTP Error for ${toPhone}:`, errData);
        return false;
      }
    } catch (error) {
      console.error(`Failed to send SMS to ${to}:`, error);
      return false;
    }
  }
}
