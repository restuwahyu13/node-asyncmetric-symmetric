import status from 'http-status'
import { QueryBuilder } from 'objection'

import { Roles } from '@models/model.roles'
import { APIResponse, apiResponse } from '@helpers/helper.apiResponse'
import { IRoles } from '@interfaces/interface.roles'
import { DTORoles, DTORolesId } from '@dtos/dto.roles'

export class ServiceRoles {
  roles: QueryBuilder<Roles, Roles[]>

  constructor() {
    this.roles = new Roles().model()
  }

  async create(body: DTORoles): Promise<APIResponse> {
    try {
      const checkRole: IRoles = await this.roles.select('name').where('name', body.name).first()
      if (checkRole) throw apiResponse({ stat_code: status.CONFLICT, err_message: `Duplicate role name ${body.name}` })

      const createRole: IRoles = await this.roles.insert({ name: body.name, permission: JSON.stringify(body.permission) }).returning('id')
      if (!createRole) throw apiResponse({ stat_code: status.FORBIDDEN, err_message: 'Create new role failed' })

      return apiResponse({ stat_code: status.OK, stat_message: 'Create new role success' })
    } catch (e: any) {
      return apiResponse(e)
    }
  }

  async findAll(): Promise<APIResponse> {
    try {
      const roleList: IRoles[] = await this.roles.select('*')
      return apiResponse({ stat_code: status.OK, stat_message: 'Get roles success', data: roleList })
    } catch (e: any) {
      return apiResponse(e)
    }
  }

  async findById(params: DTORolesId): Promise<APIResponse> {
    try {
      const getById: IRoles = await this.roles.findById(params.id)
      if (!getById) throw apiResponse({ stat_code: status.NOT_FOUND, stat_message: `Role id ${params.id} not found` })

      return apiResponse({ stat_code: status.OK, stat_message: 'Get role success', data: getById })
    } catch (e: any) {
      return apiResponse(e)
    }
  }

  async deleteById(params: DTORolesId): Promise<APIResponse> {
    try {
      const getById: IRoles = await this.roles.findById(params.id)
      if (!getById) throw apiResponse({ stat_code: status.NOT_FOUND, stat_message: `Role id ${params.id} not found` })

      const deleteRole: IRoles = await this.roles.updateAndFetchById(params.id, { delted_at: new Date() }).returning('id')
      if (!deleteRole) throw apiResponse({ stat_code: status.FORBIDDEN, stat_message: `Deleted Role id ${params.id} failed` })

      return apiResponse({ stat_code: status.OK, stat_message: `Deleted role id ${getById.id} success` })
    } catch (e: any) {
      return apiResponse(e)
    }
  }

  async updateById(params: DTORolesId, body: DTORoles): Promise<APIResponse> {
    try {
      const getById: IRoles = await this.roles.findOne({ id: params.id, name: body.name })
      if (!getById) throw apiResponse({ stat_code: status.NOT_FOUND, stat_message: `Role id ${params.id} not found` })

      const updateRole: IRoles = await this.roles.updateAndFetchById(params.id, { name: body.name, permission: JSON.stringify(body.permission) }).returning('id')
      if (!updateRole) throw apiResponse({ stat_code: status.FORBIDDEN, stat_message: `Updated Role id ${params.id} failed` })

      return apiResponse({ stat_code: status.OK, stat_message: `Updated role id ${getById.id} success` })
    } catch (e: any) {
      return apiResponse(e)
    }
  }
}
