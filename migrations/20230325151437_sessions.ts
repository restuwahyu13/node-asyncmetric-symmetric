import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('sessions', (table: Knex.TableBuilder): void => {
    table.uuid('id').primary().unique().notNullable().index('sessions_id').defaultTo(knex.raw('uuid_generate_v4()'))
    table.uuid('user_id').references('id').inTable('users').index('user_id').notNullable()
    table.string('type').notNullable()
    table.text('secret').notNullable()
    table.dateTime('expired_at').notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('sessions')
}
