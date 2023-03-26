import { Model, RelationMappings, RelationMappingsThunk, QueryBuilder } from 'objection'
import { Roles } from '@models/model.roles'
import { IUsers } from '@interfaces/interface.users'
import { Argon } from '@libs/lib.argon'

export class Users extends Model implements IUsers {
  id!: string
  email!: string
  password!: string
  role_id!: string
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date

  static get tableName(): string {
    return 'users'
  }

  static get relationMappings(): RelationMappings | RelationMappingsThunk {
    return {
      roles: {
        relation: Model.HasOneRelation,
        modelClass: Roles,
        join: {
          from: `${this.tableName}.role_id`,
          to: `${Roles.tableName}.id`
        }
      }
    }
  }

  model(): QueryBuilder<Users> {
    return Users.query()
  }

  async $beforeInsert(): Promise<void> {
    this.password = await Argon.hash(this.password)
    this.created_at = new Date()
  }

  async $beforeUpdate(): Promise<void> {
    this.password = await Argon.hash(this.password)
    this.updated_at = new Date()
  }
}
