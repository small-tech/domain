const validateDns = require('../../validate-dns.cjs')

module.exports = async (remote, message) => {
  console.log('   📡️    ❨Domain❩ Validating DNS Provider settings.')

  let dnsAccountDetails
  try {
    dnsAccountDetails = validateDns()
    remote.dns.validate.response.send({
      details: dnsAccountDetails
    })
  } catch (error) {
    remote.dns.validate.error.send({ error })
  }
}
