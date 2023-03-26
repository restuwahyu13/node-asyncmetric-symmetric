import express, { Router } from 'express'
import { ControllerUsers } from '@controllers/controller.users'
import { validator } from '@middlewares/middleware.validator'
import { DTOUsersValidation } from '@dtos/dto.users'

export class RouteUsers {
  users: InstanceType<typeof ControllerUsers>
  router: Router

  constructor() {
    this.router = express.Router({ caseSensitive: true, strict: true })
    this.users = new ControllerUsers()
  }

  main(): Router {
    this.router.post('/register', [...DTOUsersValidation.register(), validator], this.users.register())
    this.router.post('/login', [...DTOUsersValidation.login(), validator], this.users.login())

    return this.router
  }
}
