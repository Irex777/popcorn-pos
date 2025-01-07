import { google } from 'googleapis';
import { NextRequest } from 'next/server';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function PUT(request: Request) {
  try {
    const id = request.url.split('/').pop();
    const body = await request.json();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Products!A2:E',
    });

    const rows = response.data.values;
    if (!rows) {
      return Response.json({ error: 'No data found' }, { status: 404 });
    }

    const rowIndex = rows.findIndex((row) => row[0] === id) + 2;
    if (rowIndex === 1) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `Products!A${rowIndex}:E${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          id,
          body.name || '',
          body.price || '',
          body.quantity || '',
          body.description || '',
        ]],
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = request.url.split('/').pop();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Products!A2:E',
    });

    const rows = response.data.values;
    if (!rows) {
      return Response.json({ error: 'No data found' }, { status: 404 });
    }

    const rowIndex = rows.findIndex((row) => row[0] === id) + 2;
    if (rowIndex === 1) {
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    await sheets.spreadsheets.values.clear({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `Products!A${rowIndex}:E${rowIndex}`,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}