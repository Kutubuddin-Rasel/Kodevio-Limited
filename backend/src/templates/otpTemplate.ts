export interface IOtpTemplateParams {
    code: string;
    expiryMinutes: number;
    appName?: string;
}

const DEFAULT_APP_NAME = 'Jotter';

export const getOtpTemplate = ({
    code,
    expiryMinutes,
    appName = DEFAULT_APP_NAME,
}: IOtpTemplateParams): string => {
    const expiryText = `${expiryMinutes} minute${expiryMinutes !== 1 ? 's' : ''}`;
    const year = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - ${appName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px; margin: 0;">
    <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h1 style="color: #18181b; font-size: 24px; margin: 0 0 8px 0; text-align: center;">${appName}</h1>
        <h2 style="color: #52525b; font-size: 18px; font-weight: 500; margin: 0 0 24px 0; text-align: center;">Password Reset</h2>
        <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">Use this code to reset your password:</p>
        <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #18181b;">${code}</span>
        </div>
        <p style="color: #a1a1aa; font-size: 14px; text-align: center; margin: 0;">
            This code expires in ${expiryText}.<br>
            If you didn't request this, ignore this email.
        </p>
    </div>
    <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 24px 0 0 0;">© ${year} ${appName}. All rights reserved.</p>
</body>
</html>`;
};
