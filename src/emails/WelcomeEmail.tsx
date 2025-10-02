import * as React from 'react';

interface WelcomeEmailProps {
    verificationUrl: string;
}

export function WelcomeEmail({ verificationUrl }: WelcomeEmailProps) {
    return (
        <html lang="ru">
            <head>
                <meta charSet="utf-8" />
                <title>Добро пожаловать в Slydle!</title>
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
                    <img
                        src={`https://app.slydle.ru/logo.svg`}
                        alt="Slydle"
                        style={{ width: '150px', margin: '0 auto' }}
                    />
                    <h1 style={{ color: '#333333' }}>Добро пожаловать в Slydle!</h1>
                    <p style={{ color: '#555555' }}>Спасибо за регистрацию.</p>
                    <br />
                    <p style={{ color: '#555555' }}>Подтвердите адрес электронной почты, нажав на кнопку ниже.</p>
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
                    <p style={{ color: '#555555', marginTop: '20px', fontSize: '12px' }}>
                        Если кнопка не работает, перейдите по ссылке:&nbsp;
                        <a href={verificationUrl}>{verificationUrl}</a>
                    </p>
                </div>
            </body>
        </html>
    );
}
