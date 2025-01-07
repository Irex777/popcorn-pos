import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Products!A2:E',
    });

    const rows = response.data.values || [];
    const nextId = rows.length > 0 ? Math.max(...rows.map(row => parseInt(row[0]))) + 1 : 1;

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Products!A2:E',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          nextId,
          body.name,
          body.price,
          body.quantity,
          body.description || '',
        ]],
      },
    });

    return NextResponse.json({ success: true, id: nextId });
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Products!A2:E',
    });

    if (!response.data.values) {
      return NextResponse.json([]);
    }

    const products = response.data.values.map(row => ({
      id: parseInt(row[0]) || 0,
      name: typeof row[1] === 'string' ? row[1].trim() : 'Unnamed Product',
      price: parseFloat(row[2]) || 0,
      quantity: parseInt(row[3]) || 0,
      description: row[4] || '',
    }));

    return NextResponse.json(products);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}