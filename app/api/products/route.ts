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
    console.log('Fetching from sheet:', process.env.SPREADSHEET_ID);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Sheet1!A2:D',
    });

    console.log('Sheet response:', response.data.values);

    const products = response.data.values?.map(([id, name, price, quantity]) => ({
      id: parseInt(id),
      name: name,
      price: parseFloat(price),
      quantity: parseInt(quantity)
    })) || [];

    console.log('Processed products:', products);
    return NextResponse.json(products);
  } catch (error) {
    const apiError = error as GoogleApiError;
    console.error('Full error:', apiError);
    console.error('Error details:', {
      message: apiError.message,
      code: apiError.code,
      status: apiError.status,
      details: apiError.details
    });
    return NextResponse.json({ error: apiError.message }, { status: 500 });
  }
}