import { Model, QueryBuilder, RelationMappings, RelationMappingsThunk } from 'objection'
import { Users } from '@models/model.users'
import { ISessions } from '@interfaces/interface.sessions'

export class Sessions extends Model implements ISessions {
  id!: string
  user_id!: string
  type!: string
  secret!: string
  expired_at: Date
  created_at?: Date

  static get tableName(): string {
    return 'sessions'
  }

  model(): QueryBuilder<Sessions> {
    return Sessions.query()
  }
  static get relationMappings(): RelationMappings | RelationMappingsThunk {
    return {
      roles: {
        relation: Model.HasOneRelation,
        modelClass: Users,
        join: {
          from: `${this.tableName}.user_id`,
          to: `${Users.tableName}.id`
        }
      }
    }
  }
  $beforeInsert(): void {
    this.created_at = new Date()
  }
}
