import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'noon: Online Shopping in UAE | Mobiles, Electronics, Beauty & Fashion',
  description: 'Shop top electronics, fashion, and beauty on noon UAE. Complete Noon marketplace and Noon Seller Lab emulator for Zoho CRM Marketplace integrations.',
  icons: {
    icon: '/favicon.ico'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#feee00" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
