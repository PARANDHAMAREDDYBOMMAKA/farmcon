import { NextResponse } from 'next/server';
import { getApiDocs } from '@/lib/swagger';

export async function GET() {
  try {
    const spec = getApiDocs();
    return NextResponse.json(spec);
  } catch (error) {
    console.error('Error generating API docs:', error);
    return NextResponse.json(
      { error: 'Failed to generate API documentation' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Get OpenAPI specification
 *     description: Returns the complete OpenAPI 3.0 specification for the FarmCon API
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
