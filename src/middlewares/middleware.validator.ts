import { NextFunction, Request, Response } from 'express'
import { validationResult, ValidationError, Result } from 'express-validator'
import { OutgoingMessage } from 'http'
import { apiResponse } from '@helpers/helper.apiResponse'

export const validator = (req: Request, res: Response, next: NextFunction): OutgoingMessage => {
  const errors: Result<ValidationError> = validationResult(req)

  const messages: ValidationError[] = []
  if (!errors.isEmpty()) {
    for (const i of errors.array()) {
      messages.push(i)
    }
  }

  if (messages.length > 0) {
    return res.status(400).json(apiResponse({ stat_code: 400, err_message: 'Validation errors', data: messages }))
  }

  next()
}
