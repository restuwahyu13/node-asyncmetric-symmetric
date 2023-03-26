import express, { Router } from 'express'
import { ControllerRoles } from '@controllers/controller.roles'
import { validator } from '@middlewares/middleware.validator'
import { DTORolesValidation } from '@dtos/dto.roles'

export class RouteRoles {
  roles: InstanceType<typeof ControllerRoles>
  router: Router

  constructor() {
    this.router = express.Router({ caseSensitive: true, strict: true })
    this.roles = new ControllerRoles()
  }

  main(): Router {
    this.router.post('/roles', [...DTORolesValidation.create(), validator], this.roles.create())
    this.router.get('/roles', this.roles.findAll())
    this.router.get('/roles/:id', [...DTORolesValidation.findById(), validator], this.roles.findById())
    this.router.delete('/roles/:id', [...DTORolesValidation.deleteById(), validator], this.roles.deleteById())
    this.router.put('/roles/:id', [...DTORolesValidation.updateById(), validator], this.roles.updateById())

    return this.router
  }
}
