const crypto = require('crypto')

if (db.admin === undefined) {
  db.admin = {}
  // Create a cryptographically-secure path for the admin route.
  db.admin.route = crypto.randomBytes(16).toString('hex')
}

console.log(`   🔑️    ❨Basil❩ Admin page is at /${db.admin.route}`)

module.exports = app => {

  // Add the admin route using the cryptographically-secure
  // path.
  app.get(`/admin/${db.admin.route}`, (request, response) => {
    response.html(`
    <h1>Admin page</h1>
    <p>Welcome to the admin page.</p>
    <hr>
    <p><a href='https://${app.site.prettyLocation()}${app.site.stats.route}'>Site statistics.</a></p>
  `)
  })
}
