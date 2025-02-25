const apiRouter = require("express").Router()

const cors = require("cors")

const userController = require('./controllers/userController');
const postController = require('./controllers/postController');

apiRouter.use(cors())

apiRouter.get('/postsByAuthor/:username', userController.apiGetPostsByUsername)
apiRouter.post('/login', userController.apiLogin)
apiRouter.post('/create-post', userController.apiMustBeLoggedIn, postController.apiCreate)
apiRouter.delete('/post/:id', userController.apiMustBeLoggedIn, postController.apiDelete)

module.exports = apiRouter