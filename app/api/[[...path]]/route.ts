/** Historical backend handlers are preserved as text in historical-api/. */
export const dynamic = 'force-dynamic';

function unavailable() {
  return Response.json(
    { error: 'Backend integrations are disabled in this historical portfolio snapshot.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } },
  );
}

export { unavailable as GET, unavailable as POST, unavailable as PUT,
  unavailable as PATCH, unavailable as DELETE, unavailable as OPTIONS,
  unavailable as HEAD };
