// signature-trader/app/layout.tsx (Complete Code)
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";
import LenisProvider from "@/components/LenisProvider";
import Footer from "@/components/Footer";
import FirebaseClientInitializer from "@/components/FirebaseClientInitializer"; 
import ToastNotification from "@/components/ui/ToastNotification"; 

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: 'Signature Trader | Premium Cutlery, Home Decor, & Fashion',
    template: '%s | Signature Trader', 
  },
  description: 'Discover premium collections at Signature Trader. Shop high-quality cutlery, elegant home decor, stylish footwear, and modern home appliances in Pakistan.',
  
  openGraph: {
    title: 'Signature Trader | Premium Cutlery, Home Decor, & Fashion',
    description: 'Discover premium collections at Signature Trader.',
    url: 'https://signature-trader.com', 
    siteName: 'Signature Trader',
    images: [
      {

        url: '/og-image.png', 
        width: 1200,
        height: 900,
        alt: 'Signature Trader Lifestyle Collection',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  
    twitter: {
    card: 'summary_large_image',
    title: 'Signature Trader | Premium Cutlery, Home Decor, & Fashion',
    description: 'Discover premium collections at Signature Trader.',
     images: ['/og-image.png'], 
  },
};



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans bg-background text-foreground antialiased`}
      >
        <FirebaseClientInitializer /> 
        
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar /> 
          <LenisProvider>
            {children}
            </LenisProvider>
          <Footer/>
          <ToastNotification /> 
        </ThemeProvider>
      </body>
    </html>
  );
}