import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const escapeSql = (value: unknown) => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  const text = String(value).replace(/'/g, "''");
  return `'${text}'`;
};

const buildInsert = (table: string, rows: Record<string, unknown>[]) => {
  if (rows.length === 0) return '';
  const columns = Object.keys(rows[0]);
  const values = rows
    .map((row) => `(${columns.map((col) => escapeSql(row[col])).join(', ')})`)
    .join(',\n');
  return `INSERT INTO ${table} (${columns.join(', ')}) VALUES\n${values};\n`;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') === 'sql' ? 'sql' : 'json';

    const [users, streams, servers, playlists, ads] = await Promise.all([
      db.user.findMany(),
      db.stream.findMany(),
      db.server.findMany(),
      db.playlist.findMany(),
      db.ad.findMany(),
    ]);

    if (format === 'sql') {
      const sql =
        buildInsert('User', users) +
        buildInsert('Stream', streams) +
        buildInsert('Server', servers) +
        buildInsert('Playlist', playlists) +
        buildInsert('Ad', ads);

      return new NextResponse(sql, {
        headers: {
          'Content-Type': 'application/sql',
          'Content-Disposition': 'attachment; filename="backup.sql"',
        },
      });
    }

    const payload = { users, streams, servers, playlists, ads };
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="backup.json"',
      },
    });
  } catch (error) {
    console.error('Error exporting backup:', error);
    return NextResponse.json({ error: 'Failed to export backup' }, { status: 500 });
  }
}
