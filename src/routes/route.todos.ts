import express, { Router } from 'express'
import { ControllerTodos } from '@controllers/controller.todos'
import { validator } from '@middlewares/middleware.validator'
import { DTOTodosValidation } from '@dtos/dto.todos'
import { authorization } from '@middlewares/middleware.authorization'
import { signature } from '@middlewares/middleware.signature'
import { authentication } from '@middlewares/middleware.authentication'

export class RouteTodos {
  todos: InstanceType<typeof ControllerTodos>
  router: Router

  constructor() {
    this.router = express.Router({ caseSensitive: true, strict: true })
    this.todos = new ControllerTodos()
  }

  main(): Router {
    this.router.post('/', [authentication, authorization, signature, ...DTOTodosValidation.create(), validator], this.todos.create())
    this.router.get('/', [authentication, authorization, signature], this.todos.findAll())
    this.router.get('/:id', [authentication, authorization, signature, ...DTOTodosValidation.findById(), validator], this.todos.findById())
    this.router.delete('/:id', [authentication, authorization, signature, ...DTOTodosValidation.deleteById(), validator], this.todos.deleteById())
    this.router.put('/:id', [authentication, authorization, signature, ...DTOTodosValidation.updateById(), validator], this.todos.updateById())

    return this.router
  }
}
