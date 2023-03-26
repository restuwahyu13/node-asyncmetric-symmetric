import express, { Router } from 'express'
import { ControllerRoles } from '@controllers/controller.roles'
import { validator } from '@middlewares/middleware.validator'
import { DTORolesValidation } from '@dtos/dto.roles'
import { authorization } from '@middlewares/middleware.authorization'
import { signature } from '@middlewares/middleware.signature'

export class RouteRoles {
  roles: InstanceType<typeof ControllerRoles>
  router: Router

  constructor() {
    this.router = express.Router({ caseSensitive: true, strict: true })
    this.roles = new ControllerRoles()
  }

  main(): Router {
    this.router.post('/', [authorization, signature, ...DTORolesValidation.create(), validator], this.roles.create())
    this.router.get('/', [authorization, signature], this.roles.findAll())
    this.router.get('/:id', [authorization, signature, ...DTORolesValidation.findById(), validator], this.roles.findById())
    this.router.delete('/:id', [authorization, signature, ...DTORolesValidation.deleteById(), validator], this.roles.deleteById())
    this.router.put('/:id', [authorization, signature, ...DTORolesValidation.updateById(), validator], this.roles.updateById())

    return this.router
  }
}
