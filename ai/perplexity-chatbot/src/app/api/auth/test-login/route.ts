import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering - prevent static optimization
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    console.log('Test login API: Request received');
    
    const body = await request.json();
    console.log('Test login API: Request body:', JSON.stringify(body, null, 2));
    
    return NextResponse.json({
      success: true,
      message: 'Test endpoint working',
      receivedData: body
    });

  } catch (error: any) {
    console.error('Test login API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Test API error', 
        error: error.message 
      },
      { status: 500 }
    );
  }
}
