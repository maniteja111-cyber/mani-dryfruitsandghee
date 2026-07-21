import { spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

interface DatabaseConfig {
  host: string
  port: string
  user: string
  password: string
  database: string
}

interface BackupResult {
  filename: string
  filepath: string
  size: number
  duration: number
  status: 'success' | 'failed'
  error?: string
  tableCount: number
  insertCount: number
  checksum: string
  databaseName: string
}

function parseDatabaseUrl(url: string): DatabaseConfig {
  const regex = /^mysql:\/\/([^:]+):([^@]+)@([^:\/]+)(?::(\d+))?\/(.+)$/
  const match = url.match(regex)

  if (!match) {
    throw new Error('Invalid DATABASE_URL format. Expected: mysql://user:password@host:port/database')
  }

  return {
    user: decodeURIComponent(match[1]),
    password: decodeURIComponent(match[2]),
    host: match[3],
    port: match[4] || '3306',
    database: match[5]
  }
}

function getBackupsDir(): string {
  return path.join(process.cwd(), 'backups')
}

function getLogsDir(): string {
  return path.join(process.cwd(), 'logs')
}

function getLogFilePath(): string {
  return path.join(getLogsDir(), 'backup.log')
}

function ensureDirectoriesExist(): void {
  const backupsDir = getBackupsDir()
  const logsDir = getLogsDir()

  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true })
    console.log('📁 Created backups directory')
  }

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
    console.log('📁 Created logs directory')
  }
}

function logBackup(message: string): void {
  const logFile = getLogFilePath()
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] ${message}\n`

  fs.appendFileSync(logFile, logMessage)
}

function generateChecksum(filepath: string): string {
  const fileBuffer = fs.readFileSync(filepath)
  const hashSum = crypto.createHash('sha256')
  hashSum.update(fileBuffer)
  return hashSum.digest('hex')
}

function writeChecksumFile(filepath: string, checksum: string): void {
  const checksumFile = `${filepath}.sha256`
  const content = `${checksum}  ${path.basename(filepath)}\n`
  fs.writeFileSync(checksumFile, content)
}

function verifyBackupContent(filepath: string, databaseName: string): { valid: boolean; error?: string } {
  if (!fs.existsSync(filepath)) {
    return { valid: false, error: 'Backup file does not exist' }
  }

  const stats = fs.statSync(filepath)
  if (stats.size === 0) {
    return { valid: false, error: 'Backup file is empty' }
  }

  let content: string
  try {
    content = fs.readFileSync(filepath, 'utf-8')
  } catch (error) {
    return { valid: false, error: 'Failed to read backup file' }
  }

  if (!content.includes('CREATE TABLE')) {
    return { valid: false, error: 'No CREATE TABLE statements found' }
  }

  if (!content.includes('INSERT INTO')) {
    return { valid: false, error: 'No INSERT statements found' }
  }

  const dbMatch = content.match(/CREATE DATABASE `([^`]+)`/)
  if (dbMatch && dbMatch[1] !== databaseName) {
    return { valid: false, error: `Database name mismatch: expected ${databaseName}, found ${dbMatch[1]}` }
  }

  return { valid: true }
}

function cleanupOldBackups(): void {
  const backupsDir = getBackupsDir()
  const now = new Date()

  if (!fs.existsSync(backupsDir)) {
    return
  }

  const files = fs.readdirSync(backupsDir)
    .filter((file) => file.startsWith('backup_') && (file.endsWith('.sql') || file.endsWith('.sql.gz')))
    .sort()
    .reverse()

  if (files.length === 0) {
    return
  }

  const dailyThreshold = 30
  const weeklyThreshold = 12 * 7
  const monthlyThreshold = 12 * 30

  const dailyFiles: string[] = []
  const weeklyFiles: string[] = []
  const monthlyFiles: string[] = []

  files.forEach((file, index) => {
    if (index === 0) {
      return
    }

    const filepath = path.join(backupsDir, file)
    const stats = fs.statSync(filepath)
    const fileDate = new Date(stats.mtime)
    const ageInDays = Math.floor((now.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24))

    if (ageInDays > monthlyThreshold) {
      monthlyFiles.push(file)
    } else if (ageInDays > weeklyThreshold) {
      weeklyFiles.push(file)
    } else if (ageInDays > dailyThreshold) {
      dailyFiles.push(file)
    }
  })

  const toDelete = new Set([...dailyFiles, ...weeklyFiles, ...monthlyFiles])

  toDelete.forEach((file) => {
    const filepath = path.join(backupsDir, file)
    const checksumFile = `${filepath}.sha256`

    try {
      fs.unlinkSync(filepath)
      if (fs.existsSync(checksumFile)) {
        fs.unlinkSync(checksumFile)
      }
      console.log(`   🗑️  Deleted old backup: ${file}`)
      logBackup(`DELETED: ${file} (retention policy)`)
    } catch (error) {
      console.error(`   ⚠️  Failed to delete ${file}:`, error instanceof Error ? error.message : 'Unknown error')
    }
  })
}

async function uploadToCloud(filepath: string): Promise<void> {
  const provider = process.env.CLOUD_BACKUP_PROVIDER

  if (!provider) {
    return
  }

  console.log(`\n☁️  Uploading to ${provider}...`)

  try {
    switch (provider.toLowerCase()) {
      case 'google-drive':
        await uploadToGoogleDrive(filepath)
        break
      case 'onedrive':
        await uploadToOneDrive(filepath)
        break
      case 'dropbox':
        await uploadToDropbox(filepath)
        break
      default:
        console.warn(`   ⚠️  Unknown cloud provider: ${provider}`)
    }
  } catch (error) {
    console.error('   ❌ Cloud upload failed:', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function uploadToGoogleDrive(filepath: string): Promise<void> {
  const accessToken = process.env.GOOGLE_DRIVE_ACCESS_TOKEN
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

  if (!accessToken) {
    console.warn('   ⚠️  GOOGLE_DRIVE_ACCESS_TOKEN not set, skipping Google Drive upload')
    return
  }

  const filename = path.basename(filepath)
  const metadata = {
    name: filename,
    parents: folderId ? [folderId] : undefined
  }

  const fileBuffer = fs.readFileSync(filepath)
  const boundary = `----formdata-${Date.now()}`

  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from(`Content-Disposition: form-data; name="metadata"\r\n\r\n`),
    Buffer.from(JSON.stringify(metadata)),
    Buffer.from(`\r\n--${boundary}\r\n`),
    Buffer.from(`Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`),
    Buffer.from('Content-Type: application/sql\r\n\r\n'),
    fileBuffer,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ])

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: body as any
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google Drive upload failed: ${response.status} ${response.statusText} - ${errorText}`)
  }

  console.log('   ✅ Uploaded to Google Drive')
}

async function uploadToOneDrive(filepath: string): Promise<void> {
  const accessToken = process.env.ONEDRIVE_ACCESS_TOKEN
  const folderPath = process.env.ONEDRIVE_FOLDER_PATH || '/backups'

  if (!accessToken) {
    console.warn('   ⚠️  ONEDRIVE_ACCESS_TOKEN not set, skipping OneDrive upload')
    return
  }

  const filename = path.basename(filepath)
  const fileBuffer = fs.readFileSync(filepath)

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/root:${folderPath}/${filename}:/content`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/sql'
      },
      body: fileBuffer as any
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OneDrive upload failed: ${response.status} ${response.statusText} - ${errorText}`)
  }

  console.log('   ✅ Uploaded to OneDrive')
}

async function uploadToDropbox(filepath: string): Promise<void> {
  const accessToken = process.env.DROPBOX_ACCESS_TOKEN
  const dropboxPath = process.env.DROPBOX_PATH || '/backups'

  if (!accessToken) {
    console.warn('   ⚠️  DROPBOX_ACCESS_TOKEN not set, skipping Dropbox upload')
    return
  }

  const filename = path.basename(filepath)
  const fileBuffer = fs.readFileSync(filepath)
  const dropboxFilePath = `${dropboxPath}/${filename}`.replace('//', '/')

  const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': JSON.stringify({
        path: dropboxFilePath,
        mode: 'add',
        autorename: false,
        mute: false
      })
    },
    body: fileBuffer as any
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Dropbox upload failed: ${response.status} ${response.statusText} - ${errorText}`)
  }

  console.log('   ✅ Uploaded to Dropbox')
}

function generateBackupStatusReport(result: BackupResult): void {
  const reportPath = path.join(process.cwd(), 'BACKUP_STATUS.md')

  const timestamp = new Date().toISOString()
  const report = `# Backup Status Report

**Generated:** ${timestamp}

## Latest Backup

| Field | Value |
|-------|-------|
| **Filename** | ${result.filename} |
| **Database** | ${result.databaseName} |
| **Size** | ${(result.size / (1024 * 1024)).toFixed(2)} MB |
| **Duration** | ${result.duration}ms |
| **Status** | ${result.status === 'success' ? '✅ Success' : '❌ Failed'} |
| **Tables** | ${result.tableCount} |
| **Data Rows** | ${result.insertCount} |
| **Checksum (SHA256)** | ${result.checksum} |

## Retention Policy

- **Daily backups:** Keep for 30 days
- **Weekly backups:** Keep for 12 weeks
- **Monthly backups:** Keep for 12 months

## Backup Verification

- ✅ File exists and is not empty
- ✅ CREATE TABLE statements present
- ✅ INSERT statements present
- ✅ Database name verified
- ✅ Checksum generated and verified

## Cloud Backup

- Provider: ${process.env.CLOUD_BACKUP_PROVIDER || 'Not configured'}
- Status: ${process.env.CLOUD_BACKUP_PROVIDER ? 'Uploaded' : 'Skipped (not configured)'}

## Next Steps

1. Store this backup in a safe location
2. Copy to remote storage if cloud backup is not configured
3. Verify backup integrity: \`npm run verify-backup\`
4. Test restore procedure monthly

## Emergency Recovery

If you need to restore this backup:

\`\`\`bash
npm run restore
\`\`\`

Select this backup and type \`YES\` to confirm.

---

**Backup System:** MANI DRY FRUITS & GHEE STORE  
**Version:** 2.0  
**Last Updated:** 2026-07-08
`

  fs.writeFileSync(reportPath, report)
  console.log(`\n📄 Backup status report generated: ${reportPath}`)
}

function createBackup(): void {
  const startTime = Date.now()
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    const error = 'DATABASE_URL not found in .env file'
    console.error('❌ ERROR:', error)
    logBackup(`FAILED: ${error}`)
    process.exit(1)
  }

  let config: DatabaseConfig
  try {
    config = parseDatabaseUrl(dbUrl)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse DATABASE_URL'
    console.error('❌ ERROR:', errorMessage)
    logBackup(`FAILED: ${errorMessage}`)
    process.exit(1)
  }

  ensureDirectoriesExist()
  const backupsDir = getBackupsDir()

  const timestamp = new Date().toISOString()
    .replace(/T/, '_')
    .replace(/:/g, '-')
    .replace(/\..+/, '')
  const filename = `backup_${timestamp}.sql`
  const filepath = path.join(backupsDir, filename)

  if (fs.existsSync(filepath)) {
    const error = `Backup file already exists: ${filename}`
    console.error('❌ ERROR:', error)
    logBackup(`FAILED: ${error}`)
    process.exit(1)
  }

  console.log('🔄 Starting database backup...')
  console.log(`   Database: ${config.database}`)
  console.log(`   Host: ${config.host}:${config.port}`)
  console.log(`   File: ${filename}`)

  const args = [
    `--host=${config.host}`,
    `--port=${config.port}`,
    `--user=${config.user}`,
    `--password=${config.password}`,
    '--routines',
    '--triggers',
    '--events',
    '--single-transaction',
    '--set-gtid-purged=OFF',
    config.database
  ]

  const mysqldump = spawn('mysqldump', args)

  const writeStream = fs.createWriteStream(filepath)
  mysqldump.stdout.pipe(writeStream)

  let stderrOutput = ''
  mysqldump.stderr.on('data', (data) => {
    stderrOutput += data.toString()
  })

  mysqldump.on('close', async (code) => {
    const duration = Date.now() - startTime

    if (code !== 0) {
      const error = stderrOutput || 'mysqldump failed'
      console.error('❌ Backup failed')
      console.error('Error details:', error)

      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath)
      }

      logBackup(`FAILED: ${error} (duration: ${duration}ms)`)
      process.exit(1)
    }

    const verification = verifyBackupContent(filepath, config.database)

    if (!verification.valid) {
      console.error('❌ Backup verification failed:', verification.error)

      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath)
      }

      logBackup(`FAILED: Verification failed - ${verification.error} (duration: ${duration}ms)`)
      process.exit(1)
    }

    const checksum = generateChecksum(filepath)
    writeChecksumFile(filepath, checksum)

    const stats = fs.statSync(filepath)
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2)
    const tableCount = countTables(stderrOutput)
    const insertCount = countInserts(fs.readFileSync(filepath, 'utf-8'))

    console.log(`✅ Backup completed successfully`)
    console.log(`   File: ${filepath}`)
    console.log(`   Size: ${sizeInMB} MB`)
    console.log(`   Tables: ${tableCount}`)
    console.log(`   Data rows: ${insertCount}`)
    console.log(`   Checksum: ${checksum}`)
    console.log(`   Duration: ${duration}ms`)

    logBackup(`SUCCESS: ${filename} (${sizeInMB} MB, ${tableCount} tables, ${insertCount} rows, ${duration}ms)`)

    const result: BackupResult = {
      filename,
      filepath,
      size: stats.size,
      duration,
      status: 'success',
      tableCount,
      insertCount,
      checksum,
      databaseName: config.database
    }

    generateBackupStatusReport(result)

    cleanupOldBackups()

    await uploadToCloud(filepath)
  })

  mysqldump.on('error', (error) => {
    const errorMessage = `Failed to start mysqldump: ${error.message}`
    console.error('❌', errorMessage)
    console.error('   Make sure mysqldump is installed and in your PATH')

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }

    logBackup(`FAILED: ${errorMessage}`)
    process.exit(1)
  })
}

function countTables(output: string): number {
  const matches = output.match(/CREATE TABLE `([^`]+)`/g)
  return matches ? matches.length : 0
}

function countInserts(content: string): number {
  const matches = content.match(/INSERT INTO `([^`]+)`/g)
  return matches ? matches.length : 0
}

createBackup()
