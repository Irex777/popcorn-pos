import { google } from 'googleapis';
import { NextResponse } from 'next/server';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

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
  } catch (error: any) {
    console.error('Full error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}