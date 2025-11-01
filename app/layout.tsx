// signature-trader/app/layout.tsx (Complete Code)
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";
import LenisProvider from "@/components/LenisProvider";
import Footer from "@/components/Footer";
import FirebaseClientInitializer from "@/components/FirebaseClientInitializer"; 
import ToastNotification from "@/components/ui/ToastNotification"; // <-- NEW IMPORT

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Signature Trader",
  description: "Signature Trader is a platform for trading in cutlery,Shoes,Home Decor.",
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