export interface ISessions {
  id: string
  user_id: string
  type: string
  secret: string
  expired_at: Date
  created_at?: Date
}
