'use server';

import nodemailer from 'nodemailer';
import React from 'react';
import { render, pretty } from '@react-email/render';
import { WelcomeEmail } from '@/emails/WelcomeEmail';

export interface SendEmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions): Promise<void> {
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
        html,
    };

    await transporter.sendMail(mailOptions);
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
    const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
    const html = await pretty(await render(<WelcomeEmail verificationUrl={verifyUrl} />));
    await sendEmail({
        to: email,
        subject: 'Добро пожаловать в Presa!',
        text: `Чтобы подтвердить адрес электронной почты, перейдите по ссылке: ${verifyUrl}`,
        html: `<!DOCTYPE html>${html}`,
    });
}
