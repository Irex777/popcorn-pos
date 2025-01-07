// app/api/products/[id]/route.ts
import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// PUT handler for updating existing products
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const id = params.id;
    const body = await request.json();

    // Fetch the spreadsheet data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID!,
      range: 'Products!A2:F',
    });

    const rows = response.data.values;
    if (!rows) throw new Error('No data found in the spreadsheet.');

    // Find the row to update
    const rowIndex = rows.findIndex((row) => row[0] === id) + 2;
    if (rowIndex === 1) throw new Error('Product not found.');

    // Update the product
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SPREADSHEET_ID!,
      range: `Products!A${rowIndex}:F${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          [
            id,
            body.name || '',
            body.price || '',
            body.quantity || '',
            body.description || '',
            body.saveAmount || 0,
          ],
        ],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error updating product:', error);
      return NextResponse.json(
        { error: 'Failed to update product', details: error.message },
        { status: 500 }
      );
    } else {
      console.error('Unknown error updating product:', error);
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }
  }
}

// DELETE handler for removing products
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const id = params.id;

    // Fetch the spreadsheet data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID!,
      range: 'Products!A2:F',
    });

    const rows = response.data.values;
    if (!rows) throw new Error('No data found in the spreadsheet.');

    // Find the row to delete
    const rowIndex = rows.findIndex((row) => row[0] === id) + 2;
    if (rowIndex === 1) throw new Error('Product not found.');

    // Clear the product data
    await sheets.spreadsheets.values.clear({
      spreadsheetId: process.env.SPREADSHEET_ID!,
      range: `Products!A${rowIndex}:F${rowIndex}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error deleting product:', error);
      return NextResponse.json(
        { error: 'Failed to delete product', details: error.message },
        { status: 500 }
      );
    } else {
      console.error('Unknown error deleting product:', error);
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      );
    }
  }
}