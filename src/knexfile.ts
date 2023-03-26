import { config } from 'dotenv'
import path from 'path'
import { Knex } from 'knex'

config({ path: '../.env' })

const connection: Record<string, any> = {
  client: process.env.DB_CLIENT,
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

export const development: Knex.Config = {
  client: connection.client,
  connection: connection.development,
  // pool: { min: 1, max: 5 },
  debug: process.env.NODE_ENV == 'development' ? true : false,
  asyncStackTraces: process.env.NODE_ENV == 'development' ? true : false,
  acquireConnectionTimeout: 600000,
  migrations: {
    directory: path.resolve(__dirname, 'databases/migrations/')
  },
  seeds: {
    directory: path.resolve(__dirname, 'databases/seeds/')
  },
  log: {
    warn: (message: any) => console.info(`Database Warn:  ${JSON.stringify(message)}`),
    error: (message: any) => console.error(`Database Error:  ${JSON.stringify(message)}`),
    deprecate: (message: any) => console.info(`Database Deprecate:  ${JSON.stringify(message)}`),
    debug: (message: any) => console.debug(`Database Debug:  ${JSON.stringify(message)}`)
  }
}

export const production: Knex.Config = {
  client: process.env.DB_CLIENT,
  connection: connection.production,
  // pool: { min: 10, max: 20 },
  debug: process.env.NODE_ENV == 'development' ? true : false,
  asyncStackTraces: process.env.NODE_ENV == 'development' ? true : false,
  acquireConnectionTimeout: 600000,
  migrations: {
    directory: path.resolve(__dirname, 'databases/migrations/')
  },
  seeds: {
    directory: path.resolve(__dirname, 'databases/seeds/')
  },
  log: {
    warn: (message: any) => console.info(`Database Warn:  ${JSON.stringify(message)}`),
    error: (message: any) => console.error(`Database Error:  ${JSON.stringify(message)}`),
    deprecate: (message: any) => console.info(`Database Deprecate:  ${JSON.stringify(message)}`),
    debug: (message: any) => console.debug(`Database Debug:  ${JSON.stringify(message)}`)
  }
}
