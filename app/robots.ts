// signature-trader/app/robots.ts
import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  
  const siteUrl = 'https://signature-trader.com';

  return {
    rules: {
      userAgent: '*', 
      allow: ['/'], 
      disallow: [
        '/admin/', 
        '/cart/', 
        '/checkout/',
        '/account/', 
      ],
    },
    
    sitemap: `${siteUrl}/sitemap.xml`, 
  }
}