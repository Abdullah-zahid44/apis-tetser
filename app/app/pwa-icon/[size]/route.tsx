import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ size: string }> }) {
  const { size: requestedSize } = await context.params;
  const size = requestedSize === '192' ? 192 : requestedSize === '512' ? 512 : null;
  if (!size) return new Response('Not found', { status: 404 });

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#b45309',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 800,
        fontSize: size * 0.3,
        letterSpacing: '-0.08em',
      }}
    >
      AP
    </div>,
    { width: size, height: size },
  );
}
