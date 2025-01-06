import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function GET() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Products!A2:D',
    });

    if (!response.data.values) {
      return NextResponse.json([]);
    }

    const products = response.data.values.map(row => ({
      id: parseInt(row[0]) || 0,
      name: typeof row[1] === 'string' ? row[1].trim() : 'Unnamed Product',
      price: parseFloat(row[2]) || 0,
      quantity: parseInt(row[3]) || 0,
    }));

    return NextResponse.json(products);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Google Sheets API Error:', error.message);
    } else {
      console.error('Google Sheets API Error:', error);
    }
    return NextResponse.json(
      { error: 'Failed to fetch products' }, 
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, price, quantity } = body;

    // Get current data to find the row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Products!A2:D',
    });

    const rows = response.data.values;
    if (!rows) throw new Error('No data found');

    // Find the row index (add 2 because we start from A2)
    const rowIndex = rows.findIndex(row => parseInt(row[0]) === id) + 2;
    if (rowIndex === 1) throw new Error('Product not found'); // rowIndex === 1 means not found (-1 + 2)

    // Update the row
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `Products!A${rowIndex}:D${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          id,
          name,
          price,
          quantity
        ]],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}