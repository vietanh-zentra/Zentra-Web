export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/api/'],
      },
    ],
    sitemap: 'https://embodyperthshire.co.uk/sitemap.xml', // Replace with your actual domain
  };
}
