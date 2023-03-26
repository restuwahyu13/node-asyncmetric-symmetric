import { ValidationChain, check } from 'express-validator'

export interface DTORegister {
  email: string
  password: string
}

export interface DTOLogin {
  email: string
  password: string
}

export class DTOUsersValidation {
  static register(): ValidationChain[] {
    return [check('email').notEmpty(), check('email').isEmail(), check('password').notEmpty(), check('password').isAlphanumeric()]
  }

  static login(): ValidationChain[] {
    return [check('email').notEmpty(), check('email').isEmail(), check('password').notEmpty(), check('password').isAlphanumeric()]
  }
}
