import { database } from '@/database'
import session from 'express-session'

const Store = session.Store

export class BunSQLiteStore extends Store {
    constructor(_options = {}) {
        super()
        this.db = database
    }

    get(sid, callback) {
        try {
            const row = this.db
                .query('SELECT sess FROM sessions WHERE sid = ? AND expire > ?')
                .get(sid, Date.now())

            if (!row) return callback(null, null)
            const sess = JSON.parse(row.sess)
            callback(null, sess)
        } catch (err) {
            callback(err)
        }
    }

    set(sid, sess, callback) {
        try {
            const expire =
                typeof sess.cookie?.maxAge === 'number'
                    ? Date.now() + sess.cookie.maxAge
                    : Date.now() + 86400000 // Default to 1 day

            const json = JSON.stringify(sess)

            this.db.run(`INSERT OR REPLACE INTO sessions (sid, sess, expire) VALUES (?, ?, ?)`, [
                sid,
                json,
                expire
            ])

            callback?.()
        } catch (err) {
            callback?.(err)
        }
    }

    destroy(sid, callback) {
        try {
            this.db.run(`DELETE FROM sessions WHERE sid = ?`, [sid])
            callback?.()
        } catch (err) {
            callback?.(err)
        }
    }
}
