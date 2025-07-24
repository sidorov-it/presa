import * as React from 'react';

interface PasswordResetEmailProps {
    resetUrl: string;
}

export function PasswordResetEmail({ resetUrl }: PasswordResetEmailProps) {
    const logoUrl = `${process.env.NEXTAUTH_URL}/logo.svg`;
    return (
        <html>
            <head>
                <meta charSet="utf-8" />
                <title>Сброс пароля</title>
            </head>
            <body style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f8f8f8', padding: '20px' }}>
                <div
                    style={{
                        backgroundColor: '#ffffff',
                        padding: '20px',
                        borderRadius: '8px',
                        textAlign: 'center',
                    }}
                >
                    <img src={logoUrl} alt="Slydle" style={{ width: '150px', margin: '0 auto' }} />
                    <h1 style={{ color: '#333333' }}>Сброс пароля</h1>
                    <p style={{ color: '#555555' }}>Вы запросили сброс пароля.</p>
                    <br />
                    <p style={{ color: '#555555' }}>Нажмите на кнопку ниже, чтобы установить новый пароль.</p>
                    <a
                        href={resetUrl}
                        style={{
                            display: 'inline-block',
                            padding: '10px 20px',
                            marginTop: '10px',
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            borderRadius: '4px',
                            textDecoration: 'none',
                        }}
                    >
                        Сбросить пароль
                    </a>
                    <p style={{ color: '#555555', marginTop: '20px', fontSize: '12px' }}>
                        Если кнопка не работает, перейдите по ссылке:&nbsp;
                        <a href={resetUrl}>{resetUrl}</a>
                    </p>
                </div>
            </body>
        </html>
    );
}
