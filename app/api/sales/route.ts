import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS || '{}'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

interface SaleItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface SaleBody {
  items: SaleItem[];
  total: number;
  timestamp: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: SaleBody = await req.json();
    const { items, total, timestamp } = body;

    const sanitizedItems = Array.isArray(items)
      ? items.map(item => ({
          ...item,
          name: typeof item.name === 'string' ? item.name.trim() : 'Unknown',
        }))
      : [];

    const sanitizedTotal = parseFloat(total.toString()) || 0;

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Sales!A:D',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          timestamp,
          JSON.stringify(sanitizedItems),
          sanitizedTotal.toFixed(2),
          'completed',
        ]],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to record sale:', error);
    return NextResponse.json(
      { error: 'Failed to record sale' },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: 'Sales!A:D',
    });

    const sales = response.data.values?.map(([timestamp, items, total, status]) => ({
      timestamp,
      items: (() => {
        try {
          const parsedItems = JSON.parse(items);
          return Array.isArray(parsedItems)
            ? parsedItems.map(item => ({
                ...item,
                name: typeof item.name === 'string' ? item.name.trim() : 'Unknown',
              }))
            : [];
        } catch {
          return [];
        }
      })(),
      total: parseFloat(total) || 0,
      status: typeof status === 'string' ? status.trim() : 'Unknown',
    })) || [];

    return NextResponse.json(sales);
  } catch (error) {
    console.error('Failed to fetch sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}