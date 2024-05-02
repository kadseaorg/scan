import Keyv from 'keyv'

// export const keyv = new Keyv(process.env.DATABASE_URL)

export const keyv = new Keyv()

keyv.on('error', (err) => console.error('keyv connection error:', err))
