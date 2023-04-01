import { Request, Response, NextFunction } from 'express'
import status from 'http-status'
import CryptoJS from 'crypto-js'
import { apiResponse } from '@helpers/helper.apiResponse'

export const authentication = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const headers: Record<string, any> = req.headers as any
    if (!headers.hasOwnProperty(`x-${process.env.NODE_ENV}-requestid`)) throw apiResponse({ stat_code: status.FORBIDDEN, err_message: `Can't access this resource` })

    const requestid: string = headers[`x-${process.env.NODE_ENV}-requestid`]

    const decrypt: CryptoJS.lib.WordArray = CryptoJS.AES.decrypt(requestid, process.env.REQUEST_SECRET_KEY)
    if (!decrypt) throw apiResponse({ stat_code: status.FORBIDDEN, err_message: `Can't access this resource` })

    const requestidDecrypt: string = decrypt.toString(CryptoJS.enc.Utf8)
    if (requestidDecrypt != process.env.REQUEST_CONTENT) throw apiResponse({ stat_code: status.FORBIDDEN, err_message: `Can't access this resource` })

    delete req.headers[`x-${process.env.NODE_ENV}-requestid`]
    next()
  } catch (e: any) {
    if (e instanceof Error) return res.status(status.FORBIDDEN).json(apiResponse({ stat_code: status.FORBIDDEN, err_message: `Can't access this resource` }))
    else return res.status(e.stat_code).json(e)
  }
}
