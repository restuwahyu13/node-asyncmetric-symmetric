import 'dotenv/config'
import path from 'path'

const connection: Record<string, any> = {
  production: {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE
  },
  development: {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE
  }
}

export const development: Record<string, any> = {
  client: process.env.DB_CLIENT,
  connection: connection.development,
  pool: { min: 1, max: 5 },
  debug: process.env.NODE_ENV == 'development' ? true : false,
  asyncStackTraces: process.env.NODE_ENV == 'development' ? true : false,
  migrations: path.resolve(process.cwd(), 'migrations'),
  seeds: path.resolve(process.cwd(), 'seeds'),
  log: {
    warn: (message: any) => console.info(`Database Warn:  ${JSON.stringify(message)}`),
    error: (message: any) => console.error(`Database Error:  ${JSON.stringify(message)}`),
    deprecate: (message: any) => console.info(`Database Deprecate:  ${JSON.stringify(message)}`),
    debug: (message: any) => console.debug(`Database Debug:  ${JSON.stringify(message)}`)
  }
}

export const production: Record<string, any> = {
  client: process.env.DB_CLIENT,
  connection: connection.production,
  pool: { min: 10, max: 20 },
  debug: process.env.NODE_ENV == 'development' ? true : false,
  asyncStackTraces: process.env.NODE_ENV == 'development' ? true : false,
  migrations: path.resolve(process.cwd(), 'migrations'),
  seeds: path.resolve(process.cwd(), 'seeds'),
  log: {
    warn: (message: any) => console.info(`Database Warn:  ${JSON.stringify(message)}`),
    error: (message: any) => console.error(`Database Error:  ${JSON.stringify(message)}`),
    deprecate: (message: any) => console.info(`Database Deprecate:  ${JSON.stringify(message)}`),
    debug: (message: any) => console.debug(`Database Debug:  ${JSON.stringify(message)}`)
  }
}
