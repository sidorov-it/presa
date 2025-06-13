import nodemailer from 'nodemailer';

export interface SendEmailOptions {
    to: string;
    subject: string;
    text: string;
}

export async function sendEmail({ to, subject, text }: SendEmailOptions): Promise<void> {
    const transporter = nodemailer.createTransport({
        sendmail: true,
        newline: 'unix',
        path: '/usr/sbin/sendmail',
    });

    const mailOptions = {
        from: 'support@slydle.ru',
        to,
        subject,
        text,
    };

    await transporter.sendMail(mailOptions);
}
