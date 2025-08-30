// app/layout.jsx
import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'CineVault',
  description: 'Decentralized Movie Rental Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}