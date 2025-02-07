const { usersCollection } = require('../db')
const bcrypt = require('bcryptjs')
const validator = require("validator")
const md5 = require("md5")

let User = function(data, getAvatar = false) {
    this.data = data
    this.errors = []

    if (getAvatar) {
        this.getAvatar()
    }
}

User.prototype.cleanUp = function() {
    if (typeof(this.data.username) != "string") {
        this.data.username = ""
    }
    if (typeof(this.data.email) != "string") {
        this.data.email = ""
    }
    if (typeof(this.data.password) != "string") {
        this.data.password = ""
    }

    // get rid of any other properties
    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    }
}

User.prototype.validate = function() {
    return new Promise(async (resolve, reject) => {
        if(!this.data.username) {
            this.errors.push("You must provide a username!")
        }
        if(this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {
            this.errors.push("Username can only contain letters and numbers!")
        }
        if(!validator.isEmail(this.data.email)) {
            this.errors.push("You must provide a valid email address!")
        }
        if(!this.data.password) {
            this.errors.push("You must provide a valid password!")
        }
        if(this.data.password.length > 0 && this.data.password.length < 8) {
            this.errors.push("Password must be at least 8 characters!")
        }
        if(this.data.password.length >= 50) {
            this.errors.push("Maximum characters for password is 50 characters!")
        }
        if(this.data.username.length > 0 && this.data.username.length < 3) {
            this.errors.push("Username must be at least 3 characters!")
        }
        if(this.data.username.length >= 30) {
            this.errors.push("Maximum characters for username is 30 characters!")
        }
    
        // Only if username is valid then check to see if it's already taken
        if (this.data.username.length > 2 && this.data.username.length <= 30 && validator.isAlphanumeric(this.data.username)) {
            let usernameExits = await usersCollection.findOne({username: this.data.username})
            if (usernameExits) {
                this.errors.push("The username you chose has already been taken!")
            }
        }
    
        // Only if email is valid then check to see if it's already taken
        if (validator.isEmail(this.data.email)) {
            let emailExits = await usersCollection.findOne({email: this.data.email})
            if (emailExits) {
                this.errors.push("The email you chose has already been taken!")
            }
        }

        resolve()
    })
}

User.prototype.register = function() {
    return new Promise(async (resolve, reject) => {

        // Step #1: Validate user data
        this.cleanUp()
        await this.validate()
    
        // Step #2: Only if there are no validation errors then save the user data to the database
        if (!this.errors.length) {
            // Hash user password
            let salt = bcrypt.genSaltSync(10)
            this.data.password = bcrypt.hashSync(this.data.password, salt)
    
            usersCollection.insertOne(this.data)
            this.getAvatar()
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

User.prototype.login = function () {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        const attempedUser = await usersCollection.findOne({username: this.data.username})
        if (attempedUser) {
            if (bcrypt.compareSync(this.data.password, attempedUser.password)) {
                this.data = attempedUser
                this.getAvatar()
                resolve("You logged in successfuly!")
            } else {
                reject("The password is invalid!")
            }
        } else {
            reject("The username is invalid!")
        }
    })
}

User.prototype.getAvatar = function() {
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

User.doesEmailExist = function (email) {
    return new Promise(async function(resolve, reject) {
      if (typeof(email) != "string") {
        resolve(false)
        return
      }
  
      let user = await usersCollection.findOne({email: email})
      if (user) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
}

User.findByUsername = function (username) {
    return new Promise((resolve, reject) => {
        if (typeof(username) != "string") {
            reject()
            return
        }
        usersCollection.findOne({username})
        .then((userDoc) => {
            if (userDoc) {
                userDoc = new User(userDoc, true)
                userDoc = {
                    _id: userDoc.data._id,
                    username: userDoc.data.username,
                    avatar: userDoc.avatar
                }
                resolve(userDoc)
            } else {
                reject()
            }
        })
        .catch(() => {
            reject()
        })
    })
}

module.exports = User