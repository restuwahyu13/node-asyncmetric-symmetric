import { ValidationChain, check } from 'express-validator'

export interface DTORegister {
  emaail: string
  password: string
}

export interface DTOLogin {
  emaail: string
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
