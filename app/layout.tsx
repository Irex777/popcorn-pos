import './globals.css';
import NavHeader from './components/NavHeader';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <NavHeader />
        {children}
      </body>
    </html>
  );
}