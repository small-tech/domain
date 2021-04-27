module.exports = (request, response) => {
  response.json({
    ok: request.params.password === db.admin.password
  })
}
