import 'dotenv/config'
import express, { Request, Response, Express } from 'express'
import http, { Server } from 'http'
import knex, { Knex } from 'knex'
import bodyparser from 'body-parser'
import validator from 'validator'
import { Argon } from '@libs/lib.argon'
import { JsonWebToken } from '@libs/lib.jwt'
import * as knexFile from '@/knexfile'

knex(knexFile[process.env.NODE_ENV])

const app: Express = express()
const server: Server = http.createServer(app)

app.use(bodyparser.json({ limit: '1mb' }))
app.use(bodyparser.raw({ limit: '1mb' }))
app.use(bodyparser.urlencoded({ extended: true }))

app.post('/roles', async (req: Request, res: Response): Promise<http.OutgoingMessage> => {
  try {
    const roles: Knex = knex('roles')

    const checkRole: Record<string, any> = roles.select('id').where({ name: roles }).first()
    if (checkRole) throw { statCode: 409, statMessage: `Role name ${req.body.name} already exist` }

    const createRole: Record<string, any> = await roles.insert({ name: req.body.name, permission: req.body.permission }, 'id')
    if (!createRole) throw { statCode: 403, statMessage: 'Create new role failed' }

    return res.status(200).json({ statCode: 201, statMessage: 'Create new role success' })
  } catch (e: any) {
    return res.status(e.statCode).json(e)
  }
})

app.post('/todos', async (req: Request, res: Response): Promise<http.OutgoingMessage> => {
  try {
    const todos: Knex = knex('todos')

    const checkTodo: Record<string, any> = todos.select('id').where({ name: req.body.name }).first()
    if (checkTodo) throw { statCode: 409, statMessage: `Todo title ${req.body.name} already exist` }

    const createTodo: Record<string, any> = await todos.insert({ title: req.body.title, category: req.body.category, description: req.body.description }, 'id')
    if (!createTodo) throw { statCode: 403, statMessage: 'Create new todo failed' }

    return res.status(200).json({ statCode: 201, statMessage: 'Create new todo success' })
  } catch (e: any) {
    return res.status(e.statCode).json(e)
  }
})

app.post('/register', async (req: Request, res: Response): Promise<http.OutgoingMessage> => {
  try {
    const users: Knex = knex('users')

    const checkUser: Record<string, any> = users.select('id').where({ email: req.body.email }).first()
    if (checkUser) throw { statCode: 409, statMessage: `User email ${req.body.name} already exist` }

    const hashPassword: string = await Argon.hash(req.body.password)

    const createRole: Record<string, any> = await users.insert({ name: req.body.name, password: hashPassword, role_id: req.body.roleId }, 'id')
    if (!createRole) throw { statCode: 403, statMessage: 'Create new user failed' }

    return res.status(200).json({ statCode: 201, statMessage: 'Create user success' })
  } catch (e: any) {
    return res.status(e.statCode).json(e)
  }
})

app.post('/login', async (req: Request, res: Response): Promise<http.OutgoingMessage> => {
  try {
    // const users: Knex = knex('users')
    const jwt: InstanceType<typeof JsonWebToken> = new JsonWebToken()

    // const checkUser: Record<string, any> = users.select('*').where({ email: req.body.email }).first()
    // if (!checkUser) throw { statCode: 409, statMessage: `User email ${req.body.name} not exist` }

    // const verifyPassword: boolean = await Argon.verify(checkUser.password, checkUser.password)
    // if (!verifyPassword) throw { statCode: 400, statMessage: `Password ${req.body.password} miss match` }

    const token: string = await jwt.sign(req, 'restuwahyu13@gmail.com', { id: 1, email: 'restuwahyu13@gmail.com' })
    if (!validator.isJWT(token)) throw { statCode: 400, statMessage: token }

    return res.status(200).json({ statCode: 200, statMessage: 'Login success', data: { accessToken: token } })
  } catch (e: any) {
    return res.status(e.statCode).json(e)
  }
})

server.listen(process.env.PORT, () => console.log('listening on port ' + process.env.PORT))
