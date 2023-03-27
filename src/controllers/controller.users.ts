import { Request, Response, NextFunction, Handler } from 'express'
import http from 'http'
import status from 'http-status'

import { ServiceUsers } from '@services/service.users'
import { APIResponse, apiResponse } from '@helpers/helper.apiResponse'
import { Encryption } from '@helpers/helper.encryption'

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

  signatureAuth(): Handler {
    return async (req: Request, res: Response, next: NextFunction): Promise<http.OutgoingMessage> => {
      try {
        const signatureAuth: any = await new Encryption().RSA256AndHmac512(req, req['user'])
        return res.status(status.OK).json(apiResponse({ stat_code: status.OK, stat_message: 'Generate auth signature successfully', data: signatureAuth }))
      } catch (e: any) {
        return res.status(e.stat_code).json(e)
      }
    }
  }
}
