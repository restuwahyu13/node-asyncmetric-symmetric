import { ValidationChain, check } from 'express-validator'

export interface DTORoles {
  name: string
  permission: Record<string, any>
}

export interface DTORolesId {
  id: string
}

export class DTORolesValidation {
  static create(): ValidationChain[] {
    return [check('name').notEmpty(), check('name').isAlpha(), check('permission').notEmpty(), check('permission').isObject()]
  }

  static findById(): ValidationChain[] {
    return [check('id').notEmpty(), check('id').isUUID()]
  }

  static deleteById(): ValidationChain[] {
    return [check('id').notEmpty(), check('id').isUUID()]
  }

  static updateById(): ValidationChain[] {
    return [check('id').notEmpty(), check('id').isUUID(), check('name').notEmpty(), check('name').isAlpha(), check('permission').notEmpty(), check('permission').isObject()]
  }
}
