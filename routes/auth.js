const express = require('express');
const ExpressError = require('../expressError');
const jwt = require('jsonwebtoken');
const {SECRET_KEY} = require('../config')
const User = require('../models/user');

const router = new express.Router();

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post('/login', async (req, res, next) => {
    const { username, password} = req.body;

    try {
        if (!username || !password) {
            throw new ExpressError('Please provide user name and password', 400)
        }

        if (await User.authenticate(username, password)) {
            await User.updateLoginTimestamp(username)
            const token = jwt.sign(username, SECRET_KEY)
            return res.json({token})
        } else {
            return next(new ExpressError('Wrong password or user name', 400))
        }
    } catch (e) {
        next(e)
    }


})

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post('/register', async (req, res, next) => {
    const {username, password, first_name, last_name, phone} = req.body;

    try {
        if (!username || !password || !first_name || !last_name || !phone) {
            throw new ExpressError('Please provide username, password, first name, last name and phone number', 400);
        }

        const newUser = await User.register({username, password, first_name, last_name, phone});
        if (newUser) {
            await User.updateLoginTimestamp(username)
            const token = jwt.sign(username, SECRET_KEY)
            return res.json({token})

        }
    } catch (e) {
        next(e)
    }
})

module.exports = router;