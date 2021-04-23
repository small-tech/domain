////////////////////////////////////////////////////////////////////////////////
//
// Small-Web.org Basil API
//
// /domain/available/:domain
//
// Returns {domain, available: true|false}
//
// Client errors (400):
//
//   1. Requested hostname contains invalid characters. (RFC 3696)
//
// Copyright ⓒ 2020-present Aral Balkan. Licensed under AGPLv3.
// Shared with ♥ by the Small Technology Foundation.
//
// Like this? Fund us!
// https://small-tech.org/fund-us
//
////////////////////////////////////////////////////////////////////////////////

const os = require('os')
const fs = require('fs')
const path = require('path')
const dnsimple = require('dnsimple')

// Courtesy: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#never_use_eval!
const parseJsObject = obj => Function('"use strict";return (' + obj + ')')()

// Note: we are doing this manually as the configuration is an ESM file
// (as it is used by the client also) and Site.js only supports CommonJS.
const config = parseJsObject(fs.readFileSync('basil.config.js', 'utf-8').replace('export default ', ''))

//
// A records for domains are added via DNSimple.
//
// Place a file called dnsimple.json with your account details into ~/.small-tech.org/<your domain>/dnsimple.json with
// the following structure:
//
// {
//    "accountId": "Your DNSimple account ID (find it in the URL when you sign in or from Account → Automation).",
//    "zoneId": "Find your zone ID by running: (async () => console.log(await require('dnsimple')({accessToken: '<TOKEN>'}).zones.allZones('<ACCOUNT ID>')))()",
//    "accessToken": "Your access token. Generate it from DNSimple → Account → API tokens."
// }
//

const selfDomain = config.domain

console.log(`\n   🎈    ❨Basil❩ Configured to run on ${selfDomain}\n`)

const configurationDirectory = path.join(os.homedir(), '.small-tech.org', 'place', selfDomain)
const dnsimpleConfigurationFile = path.join(configurationDirectory, 'dnsimple.json')
const domainsConfigurationFile = path.join(configurationDirectory, 'domains.json')

if (!fs.existsSync(dnsimpleConfigurationFile)) {
  console.error(`Panic: DNSimple configuration data not found in ${dnsimpleConfigurationFile}. Cannot continue.`)
  process.exit(1)
}

const {accountId, zoneId, accessToken} = require(dnsimpleConfigurationFile)

if (!db.domains) {
  // If there are domains that you have manually added to the DNS
  // (or that you want to reserve), add them to a JSON array in a
  // file called ~/.small-tech.org/<your domain>/domains.json.
  db.domains = fs.existsSync(domainsConfigurationFile) ? JSON.parse(fs.readFileSync(domainsConfigurationFile, 'utf-8')) : []
}

function error (response, statusCode, errorCode, message) {
  response.statusCode = statusCode
  response.json({ code: errorCode, message })
}

module.exports = async (request, response) => {
  // const dnsHost = dnsimple({accessToken})

  const domain = request.params.domain

  // Disallow queries comprised solely of whitespace.
  if (domain.trim() === '') {
    return error(response, 400, 1, 'Hostname cannot be empty. (RFC 3696)')
  }

  // Via https://github.com/miguelmota/is-valid-hostname/blob/a375657352475b03fbd118e3b46029aca952d816/index.js#L5 implementation of RFC 3696.
  const validHostnameCharacters = /^([a-zA-Z0-9-.]+){1,253}$/g

  if (!validHostnameCharacters.test(domain)) {
    return error(response, 400, 2, 'Requested hostname contains invalid characters. (RFC 3696)')
  }

  // const zoneRecords = await dnsHost.zones.listZoneRecords(accountId, zoneId, {
  //   name_like: domain
  // })
  // const available = zoneRecords.data.length === 0

  const available = (db.domains[domain] === undefined)

  response.json({domain, available})
}
