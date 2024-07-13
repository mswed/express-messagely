const express = require('express');
const ExpressError = require('../expressError');
const User = require('../models/user');

const router = new express.Router();


/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/

router.get('/', async (req, res, next) => {
    try {

        const users = await User.all();
        res.json({users})

    } catch (e) {
        return next(e)
    }
})


/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/

router.get('/:username', async (req, res, next) => {
    try {
        const user = await User.get(req.params.username);
        res.json({user})
    } catch (e) {
        return next(e)
    }
})


/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get('/:username/to', async (req, res, next) => {
    try {
        const messages = await User.messagesTo(req.params.username);
        return res.json(messages)
    } catch (e) {
        return next(e)
    }
})

/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/

router.get('/:username/from', async (req, res, next) => {
    try {
        const messages = await User.messagesFrom(req.params.username);
        return res.json(messages)
    } catch (e) {
        return next(e)
    }
})

module.exports = router;