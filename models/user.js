/** User class for message.ly */
const db = require('../db');
const ExpressError = require('../expressError');
const bcrypt = require('bcrypt')
const {BCRYPT_WORK_FACTOR} = require('../config')
const {ensureLoggedIn} = require("../middleware/auth");


/** User of the site. */

class User {

    /** register new user -- returns
     *    {username, password, first_name, last_name, phone}
     */

    static async register({username, password, first_name, last_name, phone}) {
        if (username && password && first_name && last_name && phone) {
            // User provided all the information needed

            try {
                const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
                const results = await db.query(`INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
                                                VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
                                                RETURNING username`, [username, hashedPassword, first_name, last_name, phone])
                if (results.rows.length > 0) {
                    return {username, password, first_name, last_name, phone};
                }
            } catch (e) {
                if (e.code === '23505') {
                    // Username already taken
                    throw new ExpressError('User name taken. Please select a different username', 400)
                }
                console.log(e)
            }
        } else {
            throw new ExpressError('Please provide username, password, first name, last name and phone number', 400)
        }

    }

    /** Authenticate: is this username/password valid? Returns boolean. */

    static async authenticate(username, password) {
        if (!username || !password) {
            throw new ExpressError('Please provide a username and password', 400)
        }

        const results = await db.query(`SELECT password
                                        FROM users
                                        WHERE username = $1`, [username])

        if (results.rows.length === 0) {
            throw new ExpressError('User not found', 404)
        }

        return await bcrypt.compare(password, results.rows[0].password)
    }

    /** Update last_login_at for user */

    static async updateLoginTimestamp(username) {
        if (!username) {
            throw new ExpressError('Please provide a username', 400)
        }

        const results = await db.query(`UPDATE users
                                        SET last_login_at = current_timestamp
                                        WHERE username = $1
                                        RETURNING username`, [username])

        if (results.rows.length === 0) {
            throw new ExpressError('User not found', 404)
        }
    }

    /** All: basic info on all users:
     * [{username, first_name, last_name, phone}, ...] */

    static async all() {
        const results = await db.query(`SELECT username, first_name, last_name, phone
                                        FROM users`)

        if (results.rows.length === 0) {
            throw new ExpressError('No users found', 404)
        }

        return results.rows;
    }

    /** Get: get user by username
     *
     * returns {username,
     *          first_name,
     *          last_name,
     *          phone,
     *          join_at,
     *          last_login_at } */

    static async get(username) {
        if (!username) {
            throw new ExpressError('Please provide a username', 400)
        }

        const results = await db.query(`SELECT username, first_name, last_name, phone, join_at, last_login_at
                                        FROM users
                                        WHERE username = $1`, [username])

        if (results.rows.length === 0) {
            throw new ExpressError('User not found', 404)
        }

        return results.rows[0]
    }

    /** Return messages from this user.
     *
     * [{id, to_user, body, sent_at, read_at}]
     *
     * where to_user is
     *   {username, first_name, last_name, phone}
     */

    static async messagesFrom(username) {
        const results = await db.query(`SELECT m.id,
                                               u.username,
                                               u.first_name,
                                               u.last_name,
                                               u.phone,
                                               m.body,
                                               m.sent_at,
                                               m.read_at
                                        FROM messages AS m
                                                 JOIN users AS u ON m.to_username = u.username
                                        WHERE m.from_username = $1`, [username])

        if (results.rows.length === 0) {
            throw new ExpressError('No messages found', 404)
        }

        return results.rows.map((m) => {
            return {
                id: m.id,
                to_user: {username: m.username, first_name: m.first_name, last_name: m.last_name, phone: m.phone},
                body: m.body,
                sent_at: m.sent_at,
                read_at: m.read_at
            }
        })
    }


    /** Return messages to this user.
     *
     * [{id, from_user, body, sent_at, read_at}]
     *
     * where from_user is
     *   {username, first_name, last_name, phone}
     */

    static async messagesTo(username) {
        const results = await db.query(`SELECT m.id,
                                               u.username,
                                               u.first_name,
                                               u.last_name,
                                               u.phone,
                                               m.body,
                                               m.sent_at,
                                               m.read_at
                                        FROM messages AS m
                                                 JOIN users AS u ON m.from_username = u.username
                                        WHERE m.to_username = $1`, [username])

        if (results.rows.length === 0) {
            throw new ExpressError('No messages found', 404)
        }

        return results.rows.map((m) => {
            return {
                id: m.id,
                from_user: {username: m.username, first_name: m.first_name, last_name: m.last_name, phone: m.phone},
                body: m.body,
                sent_at: m.sent_at,
                read_at: m.read_at
            }
        })
    }
}

const user = {
    username: 'wilsonpuddnhead',
    password: 'dingDongTheWitchIsDead',
    first_name: 'Moshe',
    last_name: 'Swed',
    phone: '518-588-2122'
}

const user2 = {
    username: 'dongo',
    password: 'fsdfasfa',
    first_name: 'Bob',
    last_name: 'Boberton',
    phone: '555-576-0945'
}
// User.register(user2)
// User.authenticate('wilsonpuddnhead', 'dingDongTheWitchIsDead').then(r => console.log(r))
// User.updateLoginTimestamp('wilsonpuddnhead')
// User.all().then(r => console.log(r))
// User.get('dongo').then(r => console.log(r))
// User.messagesFrom('wilsonpuddnhead').then(r => console.log(r))
// User.messagesTo('wilsonpuddnhead').then(r => console.log(r))

module.exports = User;