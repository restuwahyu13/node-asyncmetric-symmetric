import { Model, QueryBuilder } from 'objection'
import { ITodos } from '@interfaces/interface.todos'

export class Todos extends Model implements ITodos {
  id!: string
  title!: string
  category!: string
  descriptions!: string
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date

  static get tableName(): string {
    return 'roles'
  }

  model(): QueryBuilder<Todos> {
    return Todos.query()
  }

  $beforeInsert(): void {
    this.created_at = new Date()
  }

  $beforeUpdate(): void {
    this.updated_at = new Date()
  }
}
