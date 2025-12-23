import { Resend } from 'resend';
import config from '../config';
import { logger } from '../utils';
import { getOtpTemplate } from '../templates';

interface ISendOtpParams {
    to: string;
    code: string;
    expiryMinutes?: number;
}

const DEFAULT_OTP_EXPIRY = 10;

class EmailService {
    private resend: Resend;
    private from: string;

    constructor() {
        this.resend = new Resend(config.email.apiKey);
        this.from = config.email.from;
    }

    async sendOTP({ to, code, expiryMinutes = DEFAULT_OTP_EXPIRY }: ISendOtpParams): Promise<void> {
        if (config.env === 'development') {
            logger.debug(`[DEV] OTP for ${to}: ${code} (expires in ${expiryMinutes} min)`);
        }

        const html = getOtpTemplate({ code, expiryMinutes });

        try {
            const { data, error } = await this.resend.emails.send({
                from: this.from,
                to,
                subject: 'Your Password Reset Code - Jotter',
                html,
            });

            if (error) {
                logger.error(`Resend API error for ${to}: ${error.message}`);
                if (config.env !== 'development') {
                    throw new Error(`Failed to send email: ${error.message}`);
                }
            } else {
                logger.info(`OTP email sent to ${to} (id: ${data?.id})`);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.error(`Email send failed for ${to}: ${message}`);
            if (config.env !== 'development') throw err;
        }
    }
}

export const emailService = new EmailService();
export default EmailService;
