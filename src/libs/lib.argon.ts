import 'dotenv/config'
import argon from 'argon2'
import crypto from 'crypto'

export class Argon {
  static async hash(password: string): Promise<string> {
    const argonSecret: Buffer = Buffer.from(process.env.ARGON_SECRET_KEY)
    const argonSalt: Buffer = Buffer.from(crypto.randomBytes(+process.env.ARGON_SALT_SIZE))

    const argonHash: string = await argon.hash(password, { secret: argonSecret, salt: argonSalt, hashLength: argonSalt.length * 2, type: 2 })
    return argonHash
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    const argonSecret: Buffer = Buffer.from(process.env.ARGON_SECRET_KEY)
    const argonSalt: Buffer = Buffer.from(crypto.randomBytes(+process.env.ARGON_SALT_SIZE))

    const argonHash: boolean = await argon.verify(hash, password, { secret: argonSecret, saltLength: argonSalt.length, hashLength: argonSalt.length * 2 })
    return argonHash
  }
}
