import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

export async function GET(request: Request, context: { params: Promise<{ size: string }> }) {
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
        overflow: 'hidden',
        background: '#e79543',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={new URL('/assanpay-logo.png', request.url).toString()}
        alt=""
        width={size}
        height={size}
        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.18)' }}
      />
    </div>,
    { width: size, height: size },
  );
}
