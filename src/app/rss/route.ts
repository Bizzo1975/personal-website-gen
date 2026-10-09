// /rss -> /rss.xml (permanent). Relative Location so it works behind nginx/Traefik.
export function GET() {
  return new Response(null, {
    status: 308,
    headers: { Location: '/rss.xml' },
  });
}
