import express, { Router } from 'express'
import { ControllerTodos } from '@controllers/controller.todos'
import { validator } from '@middlewares/middleware.validator'
import { DTOTodosValidation } from '@dtos/dto.todos'

export class RouteTodos {
  todos: InstanceType<typeof ControllerTodos>
  router: Router

  constructor() {
    this.router = express.Router({ caseSensitive: true, strict: true })
    this.todos = new ControllerTodos()
  }

  main(): Router {
    this.router.post('/', [...DTOTodosValidation.create(), validator], this.todos.create())
    this.router.get('/', this.todos.findAll())
    this.router.get('/:id', [...DTOTodosValidation.findById(), validator], this.todos.findById())
    this.router.delete('/:id', [...DTOTodosValidation.deleteById(), validator], this.todos.deleteById())
    this.router.put('/:id', [...DTOTodosValidation.updateById(), validator], this.todos.updateById())

    return this.router
  }
}
