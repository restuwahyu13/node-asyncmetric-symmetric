import express, { Router } from 'express'
import { ControllerUsers } from '@controllers/controller.users'
import { validator } from '@middlewares/middleware.validator'
import { authorization } from '@middlewares/middleware.authorization'
import { authentication } from '@middlewares/middleware.authentication'
import { size } from '@middlewares/middleware.size'
import { DTOUsersValidation } from '@dtos/dto.users'

export class RouteUsers {
  users: InstanceType<typeof ControllerUsers>
  router: Router

  constructor() {
    this.router = express.Router({ caseSensitive: true, strict: true })
    this.users = new ControllerUsers()
  }

  main(): Router {
    this.router.post('/register', [size(1048576), authentication, ...DTOUsersValidation.register(), validator], this.users.register())
    this.router.post('/login', [size(1048576), authentication, ...DTOUsersValidation.login(), validator], this.users.login())
    this.router.post('/signature-auth', [authentication, authorization, ...DTOUsersValidation.signatureAuth(), validator], this.users.signatureAuth())

    return this.router
  }
}
