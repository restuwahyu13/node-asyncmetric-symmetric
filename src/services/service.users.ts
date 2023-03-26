import status from 'http-status'
import { QueryBuilder } from 'objection'

import { Users } from '@models/model.users'
import { APIResponse, apiResponse } from '@helpers/helper.apiResponse'
import { IUsers } from '@interfaces/interface.users'
import { DTORegister, DTOLogin } from '@dtos/dto.users'

export class ServiceUsers {
  users: QueryBuilder<Users, Users[]>

  constructor() {
    this.users = new Users().model()
  }

  async register(body: DTORegister): Promise<APIResponse> {
    try {
      return apiResponse({ stat_code: status.OK, stat_message: 'Register new account success' })
    } catch (e: any) {
      console.log(e)
      return apiResponse(e)
    }
  }

  async login(body: DTOLogin): Promise<APIResponse> {
    try {
      return apiResponse({ stat_code: status.OK, stat_message: 'Login success' })
    } catch (e: any) {
      console.log(e)
      return apiResponse(e)
    }
  }
}
