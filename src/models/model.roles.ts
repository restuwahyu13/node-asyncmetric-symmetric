import { Model, QueryBuilder } from 'objection'
import { IRoles } from '@interfaces/interface.roles'

export class Roles extends Model implements IRoles {
  id!: string
  name!: string
  permission!: string
  created_at?: Date
  updated_at?: Date
  delted_at?: Date

  static get tableName(): string {
    return 'roles'
  }

  model(): QueryBuilder<Roles> {
    return Roles.query()
  }

  $beforeInsert(): void {
    this.created_at = new Date()
  }

  $beforeUpdate(): void {
    this.updated_at = new Date()
  }
}
