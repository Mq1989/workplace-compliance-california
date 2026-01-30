import { auth } from '@clerk/nextjs/server';
import dbConnect from '@/lib/db';
import Organization from '@/lib/models/Organization';
import Document from '@/lib/models/Document';

export async function GET(request, { params }) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { id } = await params;

    await dbConnect();
    const organization = await Organization.findOne({
      clerkOrgId: orgId || userId,
    });

    if (!organization) {
      return new Response(JSON.stringify({ error: 'Organization not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const doc = await Document.findOne({
      _id: id,
      organizationId: organization._id,
    });

    if (!doc) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle base64 data URL (MVP storage approach)
    if (doc.fileUrl.startsWith('data:')) {
      const base64Data = doc.fileUrl.split(',')[1];
      const pdfBuffer = Buffer.from(base64Data, 'base64');

      return new Response(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': doc.mimeType || 'application/pdf',
          'Content-Disposition': `attachment; filename="${doc.fileName}"`,
          'Content-Length': String(pdfBuffer.length),
        },
      });
    }

    // Handle external URL (future Vercel Blob storage)
    return Response.redirect(doc.fileUrl);
  } catch (error) {
    console.error('Error downloading document:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
