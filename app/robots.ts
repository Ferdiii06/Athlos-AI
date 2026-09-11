export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://athlos.web.id';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin-rahasia/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/admin-rahasia/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
