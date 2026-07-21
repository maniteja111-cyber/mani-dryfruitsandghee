import { spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

interface DatabaseConfig {
  host: string
  port: string
  user: string
  password: string
  database: string
}

function parseDatabaseUrl(url: string): DatabaseConfig {
  const regex = /^mysql:\/\/([^:]+):([^@]+)@([^:\/]+)(?::(\d+))?\/(.+)$/
  const match = url.match(regex)

  if (!match) {
    throw new Error('Invalid DATABASE_URL format')
  }

  return {
    user: decodeURIComponent(match[1]),
    password: decodeURIComponent(match[2]),
    host: match[3],
    port: match[4] || '3306',
    database: match[5]
  }
}

function getLogsDir(): string {
  return path.join(process.cwd(), 'logs')
}

function getRestoreLogFilePath(): string {
  return path.join(getLogsDir(), 'restore.log')
}

function logRestore(message: string): void {
  const logsDir = getLogsDir()
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
  }

  const logFile = getRestoreLogFilePath()
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] ${message}\n`

  fs.appendFileSync(logFile, logMessage)
}

function verifyChecksum(filepath: string): boolean {
  const checksumFile = `${filepath}.sha256`

  if (!fs.existsSync(checksumFile)) {
    console.warn('⚠️  No checksum file found, skipping checksum verification')
    return true
  }

  const fileBuffer = fs.readFileSync(filepath)
  const hashSum = require('crypto').createHash('sha256')
  hashSum.update(fileBuffer)
  const actualChecksum = hashSum.digest('hex')

  const expectedChecksum = fs.readFileSync(checksumFile, 'utf-8').split(' ')[0]

  if (actualChecksum !== expectedChecksum) {
    console.error('❌ Checksum verification failed')
    console.error(`   Expected: ${expectedChecksum}`)
    console.error(`   Actual:   ${actualChecksum}`)
    return false
  }

  console.log('✅ Checksum verified')
  return true
}

function getBackupFiles(): string[] {
  const backupsDir = path.join(process.cwd(), 'backups')

  if (!fs.existsSync(backupsDir)) {
    console.error('❌ No backups directory found')
    logRestore('FAILED: No backups directory found')
    process.exit(1)
  }

  const files = fs.readdirSync(backupsDir)
    .filter((file) => file.endsWith('.sql') || file.endsWith('.sql.gz'))
    .sort()
    .reverse()

  if (files.length === 0) {
    console.error('❌ No backup files found in backups/ directory')
    logRestore('FAILED: No backup files found')
    process.exit(1)
  }

  return files
}

function restoreBackup(): void {
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    console.error('❌ ERROR: DATABASE_URL not found in .env file')
    logRestore('FAILED: DATABASE_URL not found')
    process.exit(1)
  }

  let config: DatabaseConfig
  try {
    config = parseDatabaseUrl(dbUrl)
  } catch (error) {
    console.error('❌ ERROR:', error instanceof Error ? error.message : 'Failed to parse DATABASE_URL')
    logRestore('FAILED: Invalid DATABASE_URL')
    process.exit(1)
  }

  const backupFiles = getBackupFiles()

  console.log('\n📦 Available backups:')
  backupFiles.forEach((file, index) => {
    const filepath = path.join(process.cwd(), 'backups', file)
    const stats = fs.statSync(filepath)
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2)
    console.log(`   ${index + 1}. ${file} (${sizeInMB} MB)`)
  })

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question('\nEnter backup number to restore: ', async (answer) => {
    const index = parseInt(answer) - 1

    if (isNaN(index) || index < 0 || index >= backupFiles.length) {
      console.error('❌ Invalid selection')
      logRestore('FAILED: Invalid backup selection')
      rl.close()
      process.exit(1)
    }

    const selectedFile = backupFiles[index]
    const filepath = path.join(process.cwd(), 'backups', selectedFile)

    console.log(`\n⚠️  WARNING: This will REPLACE all data in database "${config.database}"`)
    console.log(`   Backup file: ${selectedFile}`)

    rl.question('Type "YES" to confirm: ', async (confirm) => {
      if (confirm !== 'YES') {
        console.log('❌ Restore cancelled')
        logRestore('CANCELLED: User did not confirm')
        rl.close()
        process.exit(1)
      }

      console.log('\n🔍 Verifying backup integrity...')

      if (!verifyChecksum(filepath)) {
        console.error('❌ Backup integrity check failed')
        logRestore(`FAILED: Checksum verification failed for ${selectedFile}`)
        rl.close()
        process.exit(1)
      }

      console.log('\n🔄 Restoring database...')
      logRestore(`STARTED: Restoring from ${selectedFile}`)

      try {
        let sqlContent: string

        if (selectedFile.endsWith('.gz')) {
          const zlib = await import('zlib')
          const fileBuffer = fs.readFileSync(filepath)
          sqlContent = zlib.gunzipSync(fileBuffer).toString('utf-8')
        } else {
          sqlContent = fs.readFileSync(filepath, 'utf-8')
        }

        const mysqlArgs = [
          `--host=${config.host}`,
          `--port=${config.port}`,
          `--user=${config.user}`,
          `--password=${config.password}`,
          config.database
        ]

        await executeSqlFile(sqlContent, mysqlArgs)

        console.log('✅ Database restored successfully')
        console.log('\n📊 Verifying tables...')

        await verifyTables(config)

        console.log('\n📈 Row counts:')
        await printRowCounts(config)

        console.log('\n✅ Restore completed successfully')
        logRestore(`SUCCESS: Restored from ${selectedFile}`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('❌ Restore failed:', errorMessage)
        logRestore(`FAILED: ${errorMessage}`)
        process.exit(1)
      }

      rl.close()
    })
  })
}

function executeSqlFile(sqlContent: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const mysql = spawn('mysql', args)

    let stderrOutput = ''
    mysql.stdin.write(sqlContent)
    mysql.stdin.end()

    mysql.stderr.on('data', (data) => {
      stderrOutput += data.toString()
    })

    mysql.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderrOutput || 'MySQL command failed'))
      } else {
        resolve()
      }
    })

    mysql.on('error', (error) => {
      reject(new Error(`Failed to start mysql: ${error.message}`))
    })
  })
}

async function verifyTables(config: DatabaseConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    const mysql = spawn('mysql', [
      `--host=${config.host}`,
      `--port=${config.port}`,
      `--user=${config.user}`,
      `--password=${config.password}`,
      `--execute=SHOW TABLES IN \`${config.database}\``,
      config.database
    ])

    let stdout = ''
    let stderr = ''

    mysql.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    mysql.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    mysql.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || 'Failed to verify tables'))
        return
      }

      const tables = stdout.split('\n').filter((line) => line.trim())
      console.log(`   Found ${tables.length} tables`)

      if (tables.length === 0) {
        reject(new Error('No tables found after restore'))
      } else {
        resolve()
      }
    })
  })
}

async function printRowCounts(config: DatabaseConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    const mysql = spawn('mysql', [
      `--host=${config.host}`,
      `--port=${config.port}`,
      `--user=${config.user}`,
      `--password=${config.password}`,
      `--execute=SHOW TABLES IN \`${config.database}\``,
      config.database
    ])

    let stdout = ''
    let stderr = ''

    mysql.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    mysql.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    mysql.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || 'Failed to get tables'))
        return
      }

      const tables = stdout.split('\n').filter((line) => line.trim())

      tables.forEach((table) => {
        countTableRows(config, table.trim())
      })

      resolve()
    })
  })
}

function countTableRows(config: DatabaseConfig, table: string): void {
  const mysql = spawn('mysql', [
    `--host=${config.host}`,
    `--port=${config.port}`,
    `--user=${config.user}`,
    `--password=${config.password}`,
    `--execute=SELECT COUNT(*) as count FROM \`${table}\``,
    config.database
  ])

  let stdout = ''
  mysql.stdout.on('data', (data) => {
    stdout += data.toString()
  })

  mysql.on('close', () => {
    const match = stdout.match(/\|\s*(\d+)\s*\|/)
    const count = match ? match[1] : '0'
    console.log(`   ${table}: ${count} rows`)
  })
}

restoreBackup()
