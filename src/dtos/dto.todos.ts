import { ValidationChain, check } from 'express-validator'

export interface DTOTodos {
  title: string
  category: string
  description: string
}

export interface DTOTodosId {
  id: string
}

export class DTOTodosValidation {
  static create(): ValidationChain[] {
    return [check('title').notEmpty(), check('category').notEmpty(), check('description').notEmpty()]
  }

  static findById(): ValidationChain[] {
    return [check('id').notEmpty(), check('id').isUUID()]
  }

  static deleteById(): ValidationChain[] {
    return [check('id').notEmpty(), check('id').isUUID()]
  }

  static updateById(): ValidationChain[] {
    return [check('id').notEmpty(), check('id').isUUID(), check('title').notEmpty(), check('category').notEmpty(), check('description').notEmpty()]
  }
}
