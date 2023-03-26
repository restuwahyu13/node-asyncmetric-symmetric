import { Request, Response, NextFunction, Handler } from 'express'
import http from 'http'

import { ServiceUsers } from '@services/service.users'
import { APIResponse } from '@helpers/helper.apiResponse'

export class ControllerUsers {
  users: InstanceType<typeof ServiceUsers>

  constructor() {
    this.users = new ServiceUsers()
  }

  register(): Handler {
    return async (req: Request, res: Response, next: NextFunction): Promise<http.OutgoingMessage> => {
      try {
        const service: APIResponse = await this.users.register(req.body as any)
        return res.status(service.stat_code).json(service)
      } catch (e: any) {
        return res.status(e.stat_code).json(e)
      }
    }
  }

  login(): Handler {
    return async (req: Request, res: Response, next: NextFunction): Promise<http.OutgoingMessage> => {
      try {
        const service: APIResponse = await this.users.login(req, req.body as any)
        return res.status(service.stat_code).json(service)
      } catch (e: any) {
        return res.status(e.stat_code).json(e)
      }
    }
  }
}
