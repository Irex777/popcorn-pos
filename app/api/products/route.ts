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
        id: parseInt(row[0]),
        name: typeof row[1] === 'string' ? row[1].trim() : '', // Trim or set empty string
        price: parseFloat(row[2]) || 0, // Ensure valid number or default to 0
        quantity: parseInt(row[3]) || 0, // Ensure valid number or default to 0
      }));
      

    console.log('Raw row:', row);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Google Sheets API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}