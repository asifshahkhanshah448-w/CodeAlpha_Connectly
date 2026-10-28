import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Connectly — Modern Full-Stack Social Network',
  description: 'Connectly is a production-grade social media platform featuring user profiles, real-time posts, comments, likes, and follower networks.',
  openGraph: {
    title: 'Connectly — Modern Full-Stack Social Network',
    description: 'Connectly is a production-grade social media platform featuring user profiles, real-time posts, comments, likes, and follower networks.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Connectly — Modern Full-Stack Social Network',
    description: 'Connectly is a production-grade social media platform featuring user profiles, real-time posts, comments, likes, and follower networks.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
