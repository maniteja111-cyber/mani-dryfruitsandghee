import { execSync } from 'child_process'
import * as fs from 'fs'

function runBackup(): void {
  console.log('🔄 Running pre-migration backup...')

  try {
    const output = execSync('npx tsx scripts/backup-db.ts', {
      encoding: 'utf-8',
      stdio: 'pipe'
    })

    console.log(output)

    const backupFiles = fs.readdirSync('backups')
      .filter((file) => file.endsWith('.sql') || file.endsWith('.sql.gz'))
      .sort()
      .reverse()

    if (backupFiles.length === 0) {
      throw new Error('No backup file created')
    }

    const latestBackup = backupFiles[0]
    console.log(`✅ Pre-migration backup created: ${latestBackup}`)
  } catch (error) {
    console.error('❌ Pre-migration backup failed')
    console.error('   Migration aborted for safety')
    if (error instanceof Error) {
      console.error('   Error:', error.message)
    }
    process.exit(1)
  }
}

runBackup()
