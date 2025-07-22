import * as React from 'react';

interface WelcomeEmailProps {
    verificationUrl: string;
}

export function WelcomeEmail({ verificationUrl }: WelcomeEmailProps) {
    return (
        <html>
            <head>
                <meta charSet="utf-8" />
                <title>Добро пожаловать в Presa!</title>
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
                    <h1 style={{ color: '#333333' }}>Добро пожаловать в Presa!</h1>
                    <p style={{ color: '#555555' }}>
                        Спасибо за регистрацию. Подтвердите адрес электронной почты, нажав на кнопку ниже.
                    </p>
                    <a
                        href={verificationUrl}
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
                        Подтвердить email
                    </a>
                    <p style={{ color: '#555555', marginTop: '20px' }}>
                        Если кнопка не работает, перейдите по ссылке:&nbsp;
                        <a href={verificationUrl}>{verificationUrl}</a>
                    </p>
                </div>
            </body>
        </html>
    );
}

