import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const { params: urlParams } = resolvedParams;
  
  // Extract width and height from params like ['150', '150']
  const width = urlParams[0] || '150';
  const height = urlParams[1] || '150';
  
  // Create a simple SVG placeholder
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#6b7280" text-anchor="middle" dominant-baseline="middle">
        ${width}×${height}
      </text>
    </svg>
  `;
  
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000'
    }
  });
}