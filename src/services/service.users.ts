import status from 'http-status'
import { QueryBuilder } from 'objection'
import { Request } from 'express'
import validator from 'validator'
import moment from 'moment'

import { Users } from '@models/model.users'
import { Roles } from '@models/model.roles'
import { Sessions } from '@models/model.sessions'
import { IUsers } from '@interfaces/interface.users'
import { IRoles } from '@interfaces/interface.roles'
import { ISessions } from '@interfaces/interface.sessions'
import { APIResponse, apiResponse } from '@helpers/helper.apiResponse'
import { DTORegister, DTOLogin } from '@dtos/dto.users'
import { Argon } from '@libs/lib.argon'
import { JsonWebToken } from '@libs/lib.jwt'
import { Redis } from '@libs/lib.redis'

export class ServiceUsers {
  users: QueryBuilder<Users, Users[]>
  roles: QueryBuilder<Roles, Roles[]>
  sessions: QueryBuilder<Sessions, Sessions[]>
  redis: InstanceType<typeof Redis>
  jwtExpired: number = 500

  constructor() {
    this.users = new Users().model()
    this.roles = new Roles().model()
    this.sessions = new Sessions().model()
    this.redis = new Redis(0)
    this.jwtExpired = +process.env.JWT_EXPIRED
  }

  async register(body: DTORegister): Promise<APIResponse> {
    try {
      const checkUser: IUsers = await this.users.where('email', body.email).first()
      if (checkUser) throw apiResponse({ stat_code: status.CONFLICT, err_message: `User email ${body.email} is already registered` })

      const getRole: IRoles = await this.roles.select('id').where('name', 'user').first()
      if (!getRole) throw apiResponse({ stat_code: status.NOT_FOUND, err_message: 'Role name user is not exist' })

      const createUser: IUsers = await this.users.insert({ ...body, role_id: getRole.id }).returning('id')
      if (!createUser) throw apiResponse({ stat_code: status.FORBIDDEN, err_message: 'Register new account failed' })

      return apiResponse({ stat_code: status.OK, stat_message: 'Register new account success' })
    } catch (e: any) {
      console.log(e)
      return apiResponse(e)
    }
  }

  async login(req: Request, body: DTOLogin): Promise<APIResponse> {
    try {
      const checkUser: IUsers = await this.users.select('id', 'password').where('email', body.email).first()
      if (!checkUser) throw apiResponse({ stat_code: status.NOT_FOUND, err_message: `User email ${body.email} is not registered` })

      const checkPassword: boolean | string = await Argon.verify(body.password, checkUser.password)
      if (!checkPassword) throw apiResponse({ stat_code: status.BAD_REQUEST, err_message: `User password ${body.password} miss match` })

      const token: any = await new JsonWebToken().sign(req, checkUser.id, { id: checkUser.id })
      if (!validator.isJWT(token)) throw apiResponse({ stat_code: status.FORBIDDEN, err_message: token })

      const tokenMetadata: Record<string, any> = {
        accessToken: token,
        expired: `${+this.jwtExpired / 60} minutes`
      }

      return apiResponse({ stat_code: status.OK, stat_message: 'Login success', data: tokenMetadata })
    } catch (e: any) {
      console.error(e.message)
      if (e instanceof Error) return apiResponse({ stat_code: status.INTERNAL_SERVER_ERROR, err_message: e.message })
      else return apiResponse(e)
    }
  }
}
