import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// Handle updates to existing products
export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    const body = await request.json();

    // Fetch data from Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Products!A2:F',
    });

    const rows = response.data.values;
    if (!rows) throw new Error('No data found');

    // Find the row index for the product to be updated
    const rowIndex = rows.findIndex(row => row[0] === id) + 2;
    if (rowIndex === 1) throw new Error('Product not found');

    // Update the product in the specified row
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
    console.error('Failed to update product:', error);
    return NextResponse.json(
      { error: 'Failed to update product', details: error.message },
      { status: 500 }
    );
  }
}

// Handle deleting products
export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;

    // Fetch data from Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Products!A2:F',
    });

    const rows = response.data.values;
    if (!rows) throw new Error('No data found');

    // Find the row index for the product to be deleted
    const rowIndex = rows.findIndex(row => row[0] === id) + 2;
    if (rowIndex === 1) throw new Error('Product not found');

    // Clear the product data in the specified row
    await sheets.spreadsheets.values.clear({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `Products!A${rowIndex}:F${rowIndex}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product', details: error.message },
      { status: 500 }
    );
  }
}