import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

interface GoogleApiError extends Error {
  code?: number;
  status?: string;
  details?: unknown;
}

export async function GET() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Products!A2:D', // Changed to 'Products' instead of 'Sheet1'
    });

    const products = response.data.values?.map(([id, name, price, quantity]) => ({
      id: parseInt(id),
      name: name,
      price: parseFloat(price),
      quantity: parseInt(quantity)
    })) || [];

    return NextResponse.json(products);
  } catch (error) {
    const apiError = error as GoogleApiError;
    console.error('Google Sheets API Error:', apiError);
    return NextResponse.json({ error: apiError.message }, { status: 500 });
  }
}