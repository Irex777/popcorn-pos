import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || ''),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function GET() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Sheet2!A2:D', // Assuming sales are on Sheet2
    });

    const sales = response.data.values?.map(([timestamp, items, total, status]) => ({
      timestamp,
      items: JSON.parse(items),
      total,
      status
    })) || [];

    return NextResponse.json(sales);
  } catch (error) {
    console.error('Failed to fetch sales:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}