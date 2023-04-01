import { Request, Response, NextFunction, Handler } from 'express'
import { OutgoingMessage } from 'http'
import status from 'http-status'
import { apiResponse } from '@helpers/helper.apiResponse'

export const size = (size: number): Handler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<OutgoingMessage> => {
    try {
      const headers: Record<string, any> = req.headers as any
      if (!headers.hasOwnProperty('content-length')) throw apiResponse({ stat_code: status.BAD_REQUEST, err_message: 'Content-Length required on headers' })

      const contentSize: number = +headers['content-length']

      if ((!req.body || !req.query || !req.params) && contentSize < 59) {
        return await new Promise((resolve, _) => req.on('data', (chunk: Buffer): void => resolve(chunk.byteLength))).then((bodyLength: any): OutgoingMessage => {
          if (contentSize < 59 || contentSize != +bodyLength) {
            return res.status(413).json(apiResponse({ stat_code: 413, err_message: 'Content to many large' }))
          }
        })
      }

      const payloadSize: number = Buffer.from(JSON.stringify(req.body || req.query || req.params)).byteLength
      if (payloadSize > size || contentSize > size) throw apiResponse({ stat_code: 413, err_message: 'Content to many large' })

      next()
    } catch (e: any) {
      if (e instanceof Error) return res.status(413).json(apiResponse({ stat_code: 413, err_message: 'Content to many large' }))
      else return res.status(e.stat_code).json(e)
    }
  }
}
