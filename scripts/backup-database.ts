#!/usr/bin/env ts-node

/**
 * Automated Database Backup Script for FarmCon
 *
 * This script creates automated backups of the PostgreSQL database
 * and uploads them to cloud storage (Cloudinary or AWS S3).
 *
 * Features:
 * - Daily automated backups
 * - Compressed backup files
 * - Cloud storage integration
 * - Retention policy (keeps last 30 days)
 * - Email notifications on success/failure
 * - Health checks
 *
 * Usage:
 *   npm run backup:db
 *   or schedule with cron: 0 2 * * * cd /path/to/farmcon && npm run backup:db
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { v2 as cloudinary } from 'cloudinary';

const execAsync = promisify(exec);

// Configuration
const BACKUP_DIR = path.join(__dirname, '../backups');
const MAX_BACKUP_AGE_DAYS = 30;
const ENABLE_EMAIL_NOTIFICATIONS = process.env.ENABLE_BACKUP_NOTIFICATIONS === 'true';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Configure Cloudinary for backup storage
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

interface BackupResult {
  success: boolean;
  filename?: string;
  filepath?: string;
  size?: number;
  uploadUrl?: string;
  error?: string;
  duration?: number;
}

async function createBackup(): Promise<BackupResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const filename = `farmcon-backup-${timestamp}.sql`;
  const filepath = path.join(BACKUP_DIR, filename);
  const compressedFilename = `${filename}.gz`;
  const compressedFilepath = `${filepath}.gz`;

  try {
    console.log('🚀 Starting database backup...');
    console.log(`📅 Date: ${new Date().toLocaleString()}`);

    // Extract database connection info from DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable not set');
    }

    // Parse DATABASE_URL
    const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!urlMatch) {
      throw new Error('Invalid DATABASE_URL format');
    }

    const [, username, password, host, port, database] = urlMatch;

    console.log(`📊 Database: ${database}`);
    console.log(`🖥️  Host: ${host}`);

    // Create backup using pg_dump
    console.log('💾 Creating database dump...');
    const dumpCommand = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F p -f "${filepath}"`;

    await execAsync(dumpCommand);

    const stats = fs.statSync(filepath);
    console.log(`✅ Backup created: ${filename}`);
    console.log(`📦 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    // Compress the backup
    console.log('🗜️  Compressing backup...');
    await execAsync(`gzip "${filepath}"`);

    const compressedStats = fs.statSync(compressedFilepath);
    console.log(`✅ Compressed: ${compressedFilename}`);
    console.log(`📦 Compressed size: ${(compressedStats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📉 Compression ratio: ${((1 - compressedStats.size / stats.size) * 100).toFixed(1)}%`);

    // Upload to cloud storage
    let uploadUrl: string | undefined;
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      console.log('☁️  Uploading to Cloudinary...');
      uploadUrl = await uploadToCloudinary(compressedFilepath, compressedFilename);
      console.log(`✅ Uploaded to cloud: ${uploadUrl}`);
    } else {
      console.log('⚠️  Cloud storage not configured. Backup saved locally only.');
    }

    // Clean up old backups
    await cleanupOldBackups();

    const duration = Date.now() - startTime;
    console.log(`⏱️  Backup completed in ${(duration / 1000).toFixed(2)}s`);

    // Send success notification
    if (ENABLE_EMAIL_NOTIFICATIONS) {
      await sendNotification({
        success: true,
        filename: compressedFilename,
        size: compressedStats.size,
        uploadUrl,
        duration,
      });
    }

    return {
      success: true,
      filename: compressedFilename,
      filepath: compressedFilepath,
      size: compressedStats.size,
      uploadUrl,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Backup failed:', errorMessage);

    // Send failure notification
    if (ENABLE_EMAIL_NOTIFICATIONS) {
      await sendNotification({
        success: false,
        error: errorMessage,
        duration,
      });
    }

    return {
      success: false,
      error: errorMessage,
      duration,
    };
  }
}

async function uploadToCloudinary(filepath: string, filename: string): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(filepath, {
      resource_type: 'raw',
      folder: 'farmcon-backups',
      public_id: filename.replace('.gz', ''),
      tags: ['database-backup', 'automated'],
    });

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload backup to cloud storage');
  }
}

async function cleanupOldBackups(): Promise<void> {
  console.log('🧹 Cleaning up old backups...');

  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const maxAge = MAX_BACKUP_AGE_DAYS * 24 * 60 * 60 * 1000;

    let deletedCount = 0;

    for (const file of files) {
      if (!file.startsWith('farmcon-backup-')) continue;

      const filepath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filepath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        fs.unlinkSync(filepath);
        deletedCount++;
        console.log(`  🗑️  Deleted old backup: ${file}`);
      }
    }

    if (deletedCount === 0) {
      console.log('  ✅ No old backups to clean up');
    } else {
      console.log(`  ✅ Deleted ${deletedCount} old backup(s)`);
    }
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
  }
}

async function sendNotification(result: BackupResult): Promise<void> {
  try {
    const nodemailer = await import('nodemailer');

    const transporter = nodemailer.default.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const subject = result.success
      ? '✅ FarmCon Database Backup Successful'
      : '❌ FarmCon Database Backup Failed';

    const html = result.success
      ? `
        <h2>Database Backup Completed Successfully</h2>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Filename:</strong> ${result.filename}</p>
        <p><strong>Size:</strong> ${((result.size || 0) / 1024 / 1024).toFixed(2)} MB</p>
        <p><strong>Duration:</strong> ${((result.duration || 0) / 1000).toFixed(2)} seconds</p>
        ${result.uploadUrl ? `<p><strong>Cloud URL:</strong> <a href="${result.uploadUrl}">${result.uploadUrl}</a></p>` : ''}
        <p><strong>Status:</strong> ✅ Success</p>
      `
      : `
        <h2>Database Backup Failed</h2>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Error:</strong> ${result.error}</p>
        <p><strong>Duration:</strong> ${((result.duration || 0) / 1000).toFixed(2)} seconds</p>
        <p><strong>Status:</strong> ❌ Failed</p>
        <p style="color: red;">Please check the logs and investigate the issue immediately.</p>
      `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.BACKUP_NOTIFICATION_EMAIL || process.env.EMAIL_USER,
      subject,
      html,
    });

    console.log('📧 Notification email sent');
  } catch (error) {
    console.error('Failed to send notification email:', error);
  }
}

// Health check endpoint
export async function healthCheck(): Promise<boolean> {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backupFiles = files.filter(f => f.startsWith('farmcon-backup-'));

    if (backupFiles.length === 0) {
      console.warn('⚠️  No backups found');
      return false;
    }

    // Check if latest backup is recent (within last 25 hours for daily backups)
    const latestBackup = backupFiles
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs,
      }))
      .sort((a, b) => b.mtime - a.mtime)[0];

    const age = Date.now() - latestBackup.mtime;
    const ageHours = age / (1000 * 60 * 60);

    console.log(`📊 Latest backup: ${latestBackup.name}`);
    console.log(`⏰ Age: ${ageHours.toFixed(1)} hours`);

    if (ageHours > 25) {
      console.warn('⚠️  Latest backup is older than 25 hours');
      return false;
    }

    console.log('✅ Backup health check passed');
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return false;
  }
}

// Main execution
if (require.main === module) {
  createBackup()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Backup process completed successfully\n');
        process.exit(0);
      } else {
        console.error('\n❌ Backup process failed\n');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Unexpected error:', error);
      process.exit(1);
    });
}

export { createBackup };
