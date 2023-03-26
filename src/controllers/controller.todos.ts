import { Request, Response, NextFunction, Handler } from 'express'
import http from 'http'

import { ServiceTodos } from '@services/service.todos'
import { APIResponse } from '@helpers/helper.apiResponse'

export class ControllerTodos {
  todos: InstanceType<typeof ServiceTodos>

  constructor() {
    this.todos = new ServiceTodos()
  }

  create(): Handler {
    return async (req: Request, res: Response, next: NextFunction): Promise<http.OutgoingMessage> => {
      try {
        const service: APIResponse = await this.todos.create(req.body as any)
        return res.status(service.stat_code).json(service)
      } catch (e: any) {
        return res.status(e.stat_code).json(e)
      }
    }
  }

  findAll(): Handler {
    return async (req: Request, res: Response, next: NextFunction): Promise<http.OutgoingMessage> => {
      try {
        const service: APIResponse = await this.todos.findAll()
        return res.status(service.stat_code).json(service)
      } catch (e: any) {
        return res.status(e.stat_code).json(e)
      }
    }
  }

  findById(): Handler {
    return async (req: Request, res: Response, next: NextFunction): Promise<http.OutgoingMessage> => {
      try {
        const service: APIResponse = await this.todos.findById(req.params as any)
        return res.status(service.stat_code).json(service)
      } catch (e: any) {
        return res.status(e.stat_code).json(e)
      }
    }
  }

  deleteById(): Handler {
    return async (req: Request, res: Response, next: NextFunction): Promise<http.OutgoingMessage> => {
      try {
        const service: APIResponse = await this.todos.deleteById(req.params as any)
        return res.status(service.stat_code).json(service)
      } catch (e: any) {
        return res.status(e.stat_code).json(e)
      }
    }
  }

  updateById(): Handler {
    return async (req: Request, res: Response, next: NextFunction): Promise<http.OutgoingMessage> => {
      try {
        const service: APIResponse = await this.todos.updateById(req.params as any, req.body as any)
        return res.status(service.stat_code).json(service)
      } catch (e: any) {
        return res.status(e.stat_code).json(e)
      }
    }
  }
}
