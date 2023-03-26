import { Request, Response, NextFunction, Handler } from 'express'
import http from 'http'

import { ServiceRoles } from '@services/service.roles'
import { APIResponse } from '@helpers/helper.apiResponse'

export class ControllerRoles {
  roles: InstanceType<typeof ServiceRoles>

  constructor() {
    this.roles = new ServiceRoles()
  }

  create(): Handler {
    return async (req: Request, res: Response, next: NextFunction): Promise<http.OutgoingMessage> => {
      try {
        const service: APIResponse = await this.roles.create(req.body as any)
        return res.status(service.stat_code).json(service)
      } catch (e: any) {
        return res.status(e.stat_code).json(e)
      }
    }
  }

  findAll(): Handler {
    return async (req: Request, res: Response, next: NextFunction): Promise<http.OutgoingMessage> => {
      try {
        const service: APIResponse = await this.roles.findAll()
        return res.status(service.stat_code).json(service)
      } catch (e: any) {
        return res.status(e.stat_code).json(e)
      }
    }
  }

  findById(): Handler {
    return async (req: Request, res: Response, next: NextFunction): Promise<http.OutgoingMessage> => {
      try {
        const service: APIResponse = await this.roles.findById(req.params as any)
        return res.status(service.stat_code).json(service)
      } catch (e: any) {
        return res.status(e.stat_code).json(e)
      }
    }
  }

  deleteById(): Handler {
    return async (req: Request, res: Response, next: NextFunction): Promise<http.OutgoingMessage> => {
      try {
        const service: APIResponse = await this.roles.deleteById(req.params as any)
        return res.status(service.stat_code).json(service)
      } catch (e: any) {
        return res.status(e.stat_code).json(e)
      }
    }
  }

  updateById(): Handler {
    return async (req: Request, res: Response, next: NextFunction): Promise<http.OutgoingMessage> => {
      try {
        const service: APIResponse = await this.roles.updateById(req.params as any, req.body as any)
        return res.status(service.stat_code).json(service)
      } catch (e: any) {
        return res.status(e.stat_code).json(e)
      }
    }
  }
}
