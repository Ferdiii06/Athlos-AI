export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://athlos.web.id';
  const lastModified = new Date();

  return [
    {
      url: `${baseUrl}`,
      lastModified: lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/chat`,
      lastModified: lastModified,
      changeFrequency: 'always',
      priority: 0.9,
    },
  ];
}
