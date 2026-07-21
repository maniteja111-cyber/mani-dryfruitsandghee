import * as fs from 'fs'
import * as path from 'path'
import * as zlib from 'zlib'

interface BackupInfo {
  filename: string
  filepath: string
  size: number
  sizeMB: string
  createTableCount: number
  insertCount: number
  isEmpty: boolean
}

function getNewestBackup(): { filename: string; filepath: string } | null {
  const backupsDir = path.join(process.cwd(), 'backups')

  if (!fs.existsSync(backupsDir)) {
    console.error('❌ No backups directory found')
    process.exit(1)
  }

  const files = fs.readdirSync(backupsDir)
    .filter((file) => file.endsWith('.sql') || file.endsWith('.sql.gz'))
    .sort()
    .reverse()

  if (files.length === 0) {
    console.error('❌ No backup files found')
    process.exit(1)
  }

  return {
    filename: files[0],
    filepath: path.join(backupsDir, files[0])
  }
}

function readBackup(filepath: string): string {
  if (filepath.endsWith('.gz')) {
    const fileBuffer = fs.readFileSync(filepath)
    return zlib.gunzipSync(fileBuffer).toString('utf-8')
  }
  return fs.readFileSync(filepath, 'utf-8')
}

function verifyBackup(): void {
  const backup = getNewestBackup()

  if (!backup) {
    process.exit(1)
  }

  console.log('🔍 Verifying backup...')
  console.log(`   File: ${backup.filename}`)

  const stats = fs.statSync(backup.filepath)
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2)
  console.log(`   Size: ${sizeInMB} MB`)

  if (stats.size === 0) {
    console.error('❌ Backup file is empty')
    process.exit(1)
  }

  console.log('   Reading backup file...')
  let sqlContent: string

  try {
    sqlContent = readBackup(backup.filepath)
  } catch (error) {
    console.error('❌ Failed to read backup file:', error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  }

  if (sqlContent.trim().length === 0) {
    console.error('❌ Backup file contains no SQL content')
    process.exit(1)
  }

  console.log(`   SQL content length: ${sqlContent.length} characters`)

  const createTableMatches = sqlContent.match(/CREATE TABLE `([^`]+)`/g) || []
  const createTableCount = createTableMatches.length

  const insertMatches = sqlContent.match(/INSERT INTO `([^`]+)`/g) || []
  const insertCount = insertMatches.length

  console.log(`   CREATE TABLE statements: ${createTableCount}`)
  console.log(`   INSERT statements: ${insertCount}`)

  if (createTableCount === 0) {
    console.error('❌ No CREATE TABLE statements found - backup may be corrupted')
    process.exit(1)
  }

  if (insertCount === 0) {
    console.warn('⚠️  Warning: No INSERT statements found - backup may contain schema only')
  }

  const tableNames = new Set(
    createTableMatches.map((match) => {
      const tableMatch = match.match(/CREATE TABLE `([^`]+)`/)
      return tableMatch ? tableMatch[1] : null
    })
  )

  console.log('\n📋 Tables in backup:')
  tableNames.forEach((table) => {
    if (table) {
      console.log(`   - ${table}`)
    }
  })

  console.log('\n✅ Backup verification completed successfully')
  console.log(`   Tables: ${createTableCount}`)
  console.log(`   Data rows: ${insertCount}`)
  console.log(`   Size: ${sizeInMB} MB`)
}

verifyBackup()
