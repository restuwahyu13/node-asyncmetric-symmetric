import status from 'http-status'
import { QueryBuilder } from 'objection'

import { Todos } from '@models/model.todos'
import { APIResponse, apiResponse } from '@helpers/helper.apiResponse'
import { ITodos } from '@interfaces/interface.todos'
import { DTOTodos, DTOTodosId } from '@dtos/dto.todos'

export class ServiceTodos {
  todos: QueryBuilder<Todos, Todos[]>

  constructor() {
    this.todos = new Todos().model()
  }

  async create(body: DTOTodos): Promise<APIResponse> {
    try {
      const checkTodo: ITodos = await this.todos.select('title', 'category').where({ title: body.title, category: body.category }).first()
      if (checkTodo) throw apiResponse({ stat_code: status.CONFLICT, err_message: `Duplicate todo title ${body.title} and category ${body.category}` })

      const createTodo: ITodos = await this.todos.insert(body).returning('id')
      if (!createTodo) throw apiResponse({ stat_code: status.FORBIDDEN, err_message: 'Create new todo failed' })

      return apiResponse({ stat_code: status.OK, stat_message: 'Create new todo success' })
    } catch (e: any) {
      console.log(e)
      return apiResponse(e)
    }
  }

  async findAll(): Promise<APIResponse> {
    try {
      const todoList: ITodos[] = await this.todos.select('*')
      return apiResponse({ stat_code: status.OK, stat_message: 'Get todos success', data: todoList })
    } catch (e: any) {
      return apiResponse(e)
    }
  }

  async findById(params: DTOTodosId): Promise<APIResponse> {
    try {
      const getTodoById: ITodos = await this.todos.findById(params.id)
      if (!getTodoById) throw apiResponse({ stat_code: status.NOT_FOUND, stat_message: `Todo id ${params.id} not found` })

      return apiResponse({ stat_code: status.OK, stat_message: 'Get todo success', data: getTodoById })
    } catch (e: any) {
      return apiResponse(e)
    }
  }

  async deleteById(params: DTOTodosId): Promise<APIResponse> {
    try {
      const getTodoById: ITodos = await this.todos.findById(params.id)
      if (!getTodoById) throw apiResponse({ stat_code: status.NOT_FOUND, stat_message: `Todo id ${params.id} not found` })

      const deleteTodo: ITodos = await this.todos.updateAndFetchById(params.id, { deleted_at: new Date() }).returning('id')
      if (!deleteTodo) throw apiResponse({ stat_code: status.FORBIDDEN, stat_message: `Deleted todo id ${params.id} failed` })

      return apiResponse({ stat_code: status.OK, stat_message: `Deleted todo id ${getTodoById.id} success` })
    } catch (e: any) {
      return apiResponse(e)
    }
  }

  async updateById(params: DTOTodosId, body: DTOTodos): Promise<APIResponse> {
    try {
      const getTodoById: ITodos = await this.todos.findOne({ id: params.id, title: body.title, category: body.category })
      if (!getTodoById) throw apiResponse({ stat_code: status.NOT_FOUND, stat_message: `Todo id ${params.id} not found` })

      const updateTodo: ITodos = await this.todos.updateAndFetchById(params.id, body).returning('id')
      if (!updateTodo) throw apiResponse({ stat_code: status.FORBIDDEN, stat_message: `Updated todo id ${params.id} failed` })

      return apiResponse({ stat_code: status.OK, stat_message: `Updated todo id ${getTodoById.id} success` })
    } catch (e: any) {
      return apiResponse(e)
    }
  }
}
