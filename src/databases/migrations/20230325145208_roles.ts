import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('roles', (table: Knex.TableBuilder): void => {
    table.uuid('id').primary().unique().notNullable().index('roles_id').defaultTo(knex.raw('uuid_generate_v4()'))
    table.string('name').unique().notNullable()
    table.jsonb('permission').notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    table.timestamp('deleted_at').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('roles')
}
