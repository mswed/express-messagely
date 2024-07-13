const express = require('express');
const ExpressError = require('../expressError');
const {ensureLoggedIn} = require('../middleware/auth')
const Message = require('../models/message');

const router = new express.Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id', ensureLoggedIn , async (req, res, next) => {
    try {
        const message = await Message.get(req.params.id)
        if ([message.from_user.username, message.to_user.username].includes(req.user.username)) {
            return res.json({message})
        } else {
            throw new ExpressError('You are not allowed to view this message', 401)
        }

    } catch (e) {
        return next(e)
    }
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', async (req, res, next) => {
    try {
        const {from_username, to_username, body} = req.body;

        if (!from_username || !to_username || !body) {
            throw new ExpressError('Please provide a FROM user, a TO user and a message body', 400);
        }

        if (from_username !== req.user.username) {
            throw new ExpressError(`You can not create a message from a user that isn't you!`, 401);
        }

        const message = await Message.create({from_username, to_username, body});
        return res.json({message})
    } catch (e) {
        next(e)
    }
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', async (req, res, next) => {
    try {
        const authCheck = await Message.get(req.params.id)
        if (authCheck.to_user.username !== req.user.username) {
            throw new ExpressError('You are not authorized to mark this message as read!', 401);
        }
        const message = await Message.markRead(req.params.id)
        return res.json({message})
    } catch (e) {
        next(e)
    }
})

module.exports = router;
