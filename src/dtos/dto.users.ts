import { ValidationChain, check } from 'express-validator'
import { signature } from '../middlewares/middleware.signature'

export interface DTORegister {
  email: string
  password: string
}

export interface DTOLogin {
  email: string
  password: string
}

export interface DTOSignatureAuth {
  method: string
  path: string
  payload?: any
}

export class DTOUsersValidation {
  static register(): ValidationChain[] {
    return [check('email').notEmpty(), check('email').isEmail(), check('password').notEmpty(), check('password').isAlphanumeric()]
  }

  static login(): ValidationChain[] {
    return [check('email').notEmpty(), check('email').isEmail(), check('password').notEmpty(), check('password').isAlphanumeric()]
  }

  static signatureAuth(): ValidationChain[] {
    return [check('method').notEmpty(), check('path').notEmpty(), check('payload').isObject().optional()]
  }
}
