import { google } from 'googleapis';
import { type NextRequest } from 'next/server';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

type Params = {
  params: {
    id: string;
  };
};

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const body = await request.json();
    const id = params.id;

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

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error updating product:', error);
    return Response.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const id = params.id;

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

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return Response.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}