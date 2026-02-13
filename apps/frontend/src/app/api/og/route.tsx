import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'Luneo Platform';
  const description = searchParams.get('description') || 'La plateforme de personnalisation produits tout-en-un';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 50%, #0a0a0f 100%)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Purple gradient orb */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.3), transparent)',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-50px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(236,72,153,0.25), transparent)',
            filter: 'blur(60px)',
          }}
        />
        
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              fontSize: '32px',
              fontWeight: 800,
              background: 'linear-gradient(to right, #a855f7, #ec4899)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            LUNEO
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '56px',
            fontWeight: 800,
            color: 'white',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
            marginBottom: '20px',
            padding: '0 40px',
          }}
        >
          {title}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '24px',
            color: 'rgba(226, 232, 240, 0.8)',
            textAlign: 'center',
            maxWidth: '700px',
            lineHeight: 1.4,
            padding: '0 40px',
          }}
        >
          {description}
        </div>

        {/* Bottom gradient line */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            width: '200px',
            height: '3px',
            background: 'linear-gradient(to right, #a855f7, #ec4899)',
            borderRadius: '2px',
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
