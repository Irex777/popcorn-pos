import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

interface ProductBody {
  name: string;
  price: number;
  quantity: number;
  description?: string;
  saveAmount?: number;
}

export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const id = context.params.id;
    const body: ProductBody = await req.json();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Products!A2:F',
    });

    const rows = response.data.values;
    if (!rows) throw new Error('No data found in the spreadsheet.');

    const rowIndex = rows.findIndex((row) => row[0] === id) + 2;
    if (rowIndex === 1) throw new Error('Product not found.');

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `Products!A${rowIndex}:F${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          id,
          body.name || '',
          body.price || '',
          body.quantity || '',
          body.description || '',
          body.saveAmount || 0,
        ]],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const id = context.params.id;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Products!A2:F',
    });

    const rows = response.data.values;
    if (!rows) throw new Error('No data found in the spreadsheet.');

    const rowIndex = rows.findIndex((row) => row[0] === id) + 2;
    if (rowIndex === 1) throw new Error('Product not found.');

    await sheets.spreadsheets.values.clear({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `Products!A${rowIndex}:F${rowIndex}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}