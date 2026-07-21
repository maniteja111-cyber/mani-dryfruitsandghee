import { execSync } from 'child_process'
import { spawn } from 'child_process'
import * as fs from 'fs'

function runCommand(command: string, name: string): boolean {
  console.log(`\n▶️  ${name}...`)

  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: 'pipe'
    })
    console.log(`   ✅ ${name} passed`)
    return true
  } catch (error) {
    console.error(`   ❌ ${name} failed`)
    if (error instanceof Error && error.message) {
      console.error(`   Error: ${error.message}`)
    }
    return false
  }
}

async function runHealthCheck(): Promise<boolean> {
  console.log('\n▶️  Post-deployment health check...')

  return new Promise((resolve) => {
    const healthCheck = spawn('npx', ['tsx', 'scripts/health-check.ts'], {
      stdio: 'pipe',
      shell: true
    })

    let stdout = ''
    let stderr = ''

    healthCheck.stdout.on('data', (data) => {
      stdout += data.toString()
      process.stdout.write(data)
    })

    healthCheck.stderr.on('data', (data) => {
      stderr += data.toString()
      process.stderr.write(data)
    })

    healthCheck.on('close', (code) => {
      if (code === 0) {
        console.log('   ✅ Health check passed')
        resolve(true)
      } else {
        console.error('   ❌ Health check failed')
        resolve(false)
      }
    })

    healthCheck.on('error', (error) => {
      console.error('   ❌ Failed to run health check:', error.message)
      resolve(false)
    })
  })
}

async function runDeployChecks(): Promise<void> {
  console.log('🔍 Running pre-deployment checks...\n')

  const checks = [
    {
      name: 'Database backup',
      command: 'npx tsx scripts/backup-db.ts',
      critical: true
    },
    {
      name: 'Prisma validate',
      command: 'npx prisma validate',
      critical: true
    },
    {
      name: 'Prisma generate',
      command: 'npx prisma generate',
      critical: true
    },
    {
      name: 'Prisma migrate status',
      command: 'npx prisma migrate status',
      critical: true
    }
  ]

  let failed = false

  for (const check of checks) {
    const passed = runCommand(check.command, check.name)
    if (!passed && check.critical) {
      failed = true
    }
  }

  if (failed) {
    console.error('\n' + '='.repeat(60))
    console.error('❌ Pre-deployment checks failed')
    console.error('   Deployment cancelled')
    process.exit(1)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Pre-deployment checks passed')

  console.log('\n🚀 Starting deployment...\n')
  console.log('   (Deploy your application here)')
  console.log('   Example: git push, vercel deploy, etc.\n')

  const healthPassed = await runHealthCheck()

  console.log('\n' + '='.repeat(60))

  if (!healthPassed) {
    console.error('❌ Post-deployment health checks failed')
    console.error('   Deployment may have issues')
    process.exit(1)
  }

  console.log('✅ Deployment completed successfully')
}

runDeployChecks()
