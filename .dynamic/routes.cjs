const crypto = require('crypto')

module.exports = app => {
  if (db.admin === undefined) {
    db.admin = {}
    // Create a cryptographically-secure path for the admin route.
    db.admin.password = crypto.randomBytes(16).toString('hex')
  }

  console.log(`   🔑️    ❨Basil❩ Admin password is ${db.admin.password}`)
}
