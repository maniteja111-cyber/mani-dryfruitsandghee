import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface HealthCheckResult {
  name: string
  status: 'pass' | 'fail'
  message: string
  duration: number
}

async function checkDatabaseConnection(): Promise<HealthCheckResult> {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return {
      name: 'Database Connection',
      status: 'pass',
      message: 'Successfully connected to database',
      duration: Date.now() - start
    }
  } catch (error) {
    return {
      name: 'Database Connection',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start
    }
  }
}

async function checkProductsTable(): Promise<HealthCheckResult> {
  const start = Date.now()
  try {
    const count = await prisma.product.count()
    return {
      name: 'Products Table',
      status: 'pass',
      message: `Products table accessible, ${count} products found`,
      duration: Date.now() - start
    }
  } catch (error) {
    return {
      name: 'Products Table',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start
    }
  }
}

async function checkCategoriesTable(): Promise<HealthCheckResult> {
  const start = Date.now()
  try {
    const count = await prisma.category.count()
    return {
      name: 'Categories Table',
      status: 'pass',
      message: `Categories table accessible, ${count} categories found`,
      duration: Date.now() - start
    }
  } catch (error) {
    return {
      name: 'Categories Table',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start
    }
  }
}

async function checkSettingsTable(): Promise<HealthCheckResult> {
  const start = Date.now()
  try {
    const count = await prisma.setting.count()
    return {
      name: 'Settings Table',
      status: 'pass',
      message: `Settings table accessible, ${count} settings found`,
      duration: Date.now() - start
    }
  } catch (error) {
    return {
      name: 'Settings Table',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start
    }
  }
}

async function checkAdminUser(): Promise<HealthCheckResult> {
  const start = Date.now()
  try {
    const admin = await prisma.user.findFirst({
      where: { phone: '9999999999' }
    })

    if (!admin) {
      return {
        name: 'Admin User',
        status: 'fail',
        message: 'Admin user not found (phone: 9999999999)',
        duration: Date.now() - start
      }
    }

    return {
      name: 'Admin User',
      status: 'pass',
      message: `Admin user found (ID: ${admin.id})`,
      duration: Date.now() - start
    }
  } catch (error) {
    return {
      name: 'Admin User',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - start
    }
  }
}

async function checkHttpEndpoint(url: string, name: string): Promise<HealthCheckResult> {
  const start = Date.now()
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (response.ok) {
      return {
        name,
        status: 'pass',
        message: `HTTP ${response.status} - ${response.statusText}`,
        duration: Date.now() - start
      }
    } else {
      return {
        name,
        status: 'fail',
        message: `HTTP ${response.status} - ${response.statusText}`,
        duration: Date.now() - start
      }
    }
  } catch (error) {
    return {
      name,
      status: 'fail',
      message: error instanceof Error ? error.message : 'Connection failed',
      duration: Date.now() - start
    }
  }
}

async function runHealthChecks(): Promise<void> {
  console.log('🏥 Running post-deployment health checks...\n')

  const checks: (() => Promise<HealthCheckResult>)[] = [
    checkDatabaseConnection,
    checkProductsTable,
    checkCategoriesTable,
    checkSettingsTable,
    checkAdminUser,
    () => checkHttpEndpoint('http://localhost:3000', 'Home Page'),
    () => checkHttpEndpoint('http://localhost:3000/products', 'Products Page'),
    () => checkHttpEndpoint('http://localhost:3000/api/products', 'API /products'),
    () => checkHttpEndpoint('http://localhost:3000/api/settings', 'API /settings')
  ]

  const results: HealthCheckResult[] = []

  for (const check of checks) {
    const result = await check()
    results.push(result)

    const statusIcon = result.status === 'pass' ? '✅' : '❌'
    console.log(`${statusIcon} ${result.name}: ${result.message} (${result.duration}ms)`)
  }

  console.log('\n' + '='.repeat(60))

  const failedChecks = results.filter((r) => r.status === 'fail')

  if (failedChecks.length > 0) {
    console.error('\n❌ Health checks failed:')
    failedChecks.forEach((check) => {
      console.error(`   - ${check.name}: ${check.message}`)
    })
    console.error('\nDeployment failed. Fix the issues above and retry.')
    await prisma.$disconnect()
    process.exit(1)
  } else {
    console.log('\n✅ All health checks passed')
    console.log('Deployment successful!')
  }

  await prisma.$disconnect()
}

runHealthChecks()
