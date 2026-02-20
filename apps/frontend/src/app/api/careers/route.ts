import { NextRequest, NextResponse } from 'next/server';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@luneo.app';
const CAREERS_EMAIL = 'careers@luneo.app';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;
    const file = formData.get('file') as File | null;

    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Nom, email et message sont requis.' },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Adresse email invalide.' },
        { status: 400 },
      );
    }

    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { success: false, error: 'Format de fichier non supporté. Utilisez PDF, DOC ou DOCX.' },
          { status: 400 },
        );
      }
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: 'Le fichier ne doit pas dépasser 10 Mo.' },
          { status: 400 },
        );
      }
    }

    const htmlBody = `
      <h2>Candidature Spontanée - Luneo</h2>
      <p><strong>Nom :</strong> ${escapeHtml(name)}</p>
      <p><strong>Email :</strong> ${escapeHtml(email)}</p>
      <h3>Message / Motivation</h3>
      <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      ${file ? `<p><strong>CV joint :</strong> ${escapeHtml(file.name)} (${(file.size / 1024).toFixed(0)} Ko)</p>` : '<p><em>Aucun CV joint</em></p>'}
    `;

    if (!SENDGRID_API_KEY) {
      console.log('[Careers] SendGrid not configured, logging submission:', { name, email });
      return NextResponse.json({ success: true });
    }

    const attachments: Array<{ content: string; filename: string; type: string; disposition: string }> = [];
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      attachments.push({
        content: buffer.toString('base64'),
        filename: file.name,
        type: file.type,
        disposition: 'attachment',
      });
    }

    const sgResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: CAREERS_EMAIL }] }],
        from: { email: FROM_EMAIL, name: 'Luneo Careers' },
        reply_to: { email, name },
        subject: `[Candidature spontanée] ${name}`,
        content: [{ type: 'text/html', value: htmlBody }],
        ...(attachments.length > 0 ? { attachments } : {}),
      }),
    });

    if (!sgResponse.ok) {
      const errorText = await sgResponse.text();
      console.error('[Careers] SendGrid error:', sgResponse.status, errorText);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'envoi. Veuillez réessayer.' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Careers] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne.' },
      { status: 500 },
    );
  }
}
