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
    this.router.post('/todos', [...DTOTodosValidation.create(), validator], this.todos.create())
    this.router.get('/todos', this.todos.findAll())
    this.router.get('/todos/:id', [...DTOTodosValidation.findById(), validator], this.todos.findById())
    this.router.delete('/todos/:id', [...DTOTodosValidation.deleteById(), validator], this.todos.deleteById())
    this.router.put('/todos/:id', [...DTOTodosValidation.updateById(), validator], this.todos.updateById())

    return this.router
  }
}
