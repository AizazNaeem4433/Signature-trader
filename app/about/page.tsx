// signature-trader/app/about/page.tsx

import { Metadata } from 'next';
import AboutClient from './about-client';


export const metadata: Metadata = {
  title: 'About  | Signature Trader',
  description: 'Learn about Signature Trader, our philosophy, and our commitment to quality in cutlery, shoes, home appliances, and more.',
  openGraph: {
    title: 'About | Signature Trader',
    description: 'Discover the story behind Signature Trader.',
    images: [
      {
        url: '/about/lifestyle.png', 
        width: 1200,
        height: 900,
        alt: 'Signature Trader Lifestyle',
      },
    ],
  },
};
// --- METADATA END ---

export default function AboutPage() {
  return <AboutClient />;
}