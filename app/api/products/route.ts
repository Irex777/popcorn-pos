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
      range: 'Products!A2:D', // Ensure the range is correct
    });

    if (!response.data.values) {
      return NextResponse.json([]);
    }

    const products = response.data.values.map(row => ({
      id: parseInt(row[0]) || 0, // Ensure ID is a valid number or default to 0
      name: typeof row[1] === 'string' ? row[1].trim() : 'Unnamed Product', // Trim string or use default
      price: parseFloat(row[2]) || 0, // Ensure price is a valid number or default to 0
      quantity: parseInt(row[3]) || 0, // Ensure quantity is a valid number or default to 0
    }));

    return NextResponse.json(products);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Google Sheets API Error:', error.message); // Safe access to .message
    } else {
      console.error('Google Sheets API Error:', error); // Fallback for non-Error types
    }
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}