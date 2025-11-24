import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * @swagger
 * /api/admin/backup:
 *   post:
 *     summary: Trigger manual database backup
 *     description: Manually trigger a database backup. This endpoint should only be accessible to admin users.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Backup initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Backup failed
 *   get:
 *     summary: Get backup health status
 *     description: Check the status of automated backups and get information about recent backups
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Backup health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 healthy:
 *                   type: boolean
 *                 lastBackup:
 *                   type: object
 *                 backupCount:
 *                   type: integer
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const user = await getAuthenticatedUser(request);
    // if (user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('📊 Manual backup triggered');

    // Trigger backup script
    execAsync('npm run backup:db').catch(error => {
      console.error('Backup script error:', error);
    });

    return NextResponse.json({
      message: 'Backup process initiated',
      status: 'running',
      note: 'Backup is running in the background. Check logs for progress.',
    });
  } catch (error) {
    console.error('Backup trigger error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate backup' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check

    const fs = await import('fs');
    const path = await import('path');

    const backupDir = path.join(process.cwd(), 'backups');

    if (!fs.existsSync(backupDir)) {
      return NextResponse.json({
        healthy: false,
        message: 'Backup directory does not exist',
        backupCount: 0,
      });
    }

    const files = fs.readdirSync(backupDir);
    const backupFiles = files
      .filter(f => f.startsWith('farmcon-backup-'))
      .map(f => ({
        name: f,
        size: fs.statSync(path.join(backupDir, f)).size,
        date: fs.statSync(path.join(backupDir, f)).mtime,
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    const latestBackup = backupFiles[0];
    const now = Date.now();
    const ageHours = latestBackup
      ? (now - latestBackup.date.getTime()) / (1000 * 60 * 60)
      : Infinity;

    return NextResponse.json({
      healthy: ageHours < 25,
      backupCount: backupFiles.length,
      lastBackup: latestBackup
        ? {
            filename: latestBackup.name,
            size: `${(latestBackup.size / 1024 / 1024).toFixed(2)} MB`,
            date: latestBackup.date.toISOString(),
            ageHours: ageHours.toFixed(1),
          }
        : null,
      recentBackups: backupFiles.slice(0, 5).map(b => ({
        filename: b.name,
        size: `${(b.size / 1024 / 1024).toFixed(2)} MB`,
        date: b.date.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Backup status error:', error);
    return NextResponse.json(
      { error: 'Failed to get backup status' },
      { status: 500 }
    );
  }
}
