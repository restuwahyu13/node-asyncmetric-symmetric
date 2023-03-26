import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table: Knex.TableBuilder): void => {
    table.uuid('id').primary().unique().notNullable().index('users_id').defaultTo(knex.raw('uuid_generate_v4()'))
    table.string('email').unique().notNullable()
    table.text('password').unique().notNullable()
    table.uuid('role_id').references('id').inTable('roles').index('role').notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    table.timestamp('deleted_at').defaultTo(null)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users')
}
