import Knex from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('todos', (table: Knex.TableBuilder): void => {
    table.uuid('id').primary().unique().notNullable().index('todos_id').defaultTo(knex.raw('uuid_generate_v4()'))
    table.string('title').unique().notNullable()
    table.string('category').unique().notNullable()
    table.string('description').unique().notNullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    table.timestamp('deleted_at').defaultTo(null)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('todos')
}
