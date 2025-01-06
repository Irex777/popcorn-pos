import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, total, timestamp } = body;

    // Add sale to Sales sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Sales!A:D',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          timestamp,
          JSON.stringify(items),
          total.toFixed(2),
          'completed'
        ]]
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to record sale:', error);
    return NextResponse.json({ error: 'Failed to record sale' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Sales!A:D',
    });

    const sales = response.data.values?.map(([timestamp, items, total, status]) => ({
      timestamp,
      items: JSON.parse(items),
      total: parseFloat(total),
      status
    })) || [];

    return NextResponse.json(sales);
  } catch (error) {
    console.error('Failed to fetch sales:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}