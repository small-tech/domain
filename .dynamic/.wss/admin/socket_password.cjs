const set = require('keypather/set')
const exec = require('child_process').exec
const process = require('process')
const fetch = require('node-fetch')

const dnsimple = require('dnsimple')
const HetznerCloud = require('hcloud-js')

module.exports = function (client, request) {
  const password = request.params.password

  console.log(`   🔐️    ❨Basil❩ Socket connection request.`)

  // Set the client’s room to limit private broadcasts to people who are authenticated.
  client.room = this.setRoom({url: '/admin'})

  client.on('message', async data => {
    const message = JSON.parse(data)

    switch(message.type) {
      case 'update':
        // Update the value at a specific keypath.
        // console.log('Update', message)
        set(db, message.keyPath, message.value)
      break;

      case 'rebuild':
        // Rebuild the site.
        console.log('Rebuilding site…')
        exec('NODE_TLS_REJECT_UNAUTHORIZED=0 svelte-kit build', {env: process.env, cwd: process.cwd()}, (error, stdout, stderr) => {
          if (error) {
            console.log('ERROR', stderr)
          } else {
            console.log(stdout)
            console.log('Done.')
          }
        })
      break;

      case 'get-price':
        // Return the price from the Stripe API.
        const stripeDetails = db.settings.payment.modeDetails[message.mode === 'live' ? 1 : 0]
        const secretKey = Buffer.from(stripeDetails.secretKey).toString('base64')
        const priceDetails = await (await fetch(`https://api.stripe.com/v1/prices/${stripeDetails.priceId}`, {
          headers: {
            Authorization: `Basic ${secretKey}`
          }
        })).json()

        console.log(`   📡️    ❨Basil❩ Validating Payment Provider settings (${message.mode} mode).`)

        if (priceDetails.error) {
          client.send(JSON.stringify({
            type: 'price-error',
            mode: message.mode,
            error: priceDetails.error
          }))
        } else {
          client.send(JSON.stringify({
            type: 'price',
            mode: message.mode,
            currency: priceDetails.currency,
            amount: priceDetails.unit_amount / 100
          }))
        }
      break;

      case 'validate-vps':
        console.log('   📡️    ❨Basil❩ Validating VPS Provider settings.')

        // Get server types. (In this first call we’ll know if the
        // authorisation token is correct or not.)
        const response = await fetch('https://api.hetzner.cloud/v1/server_types?per_page=50', {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${db.settings.vps.apiToken}`
          }
        })

        if (response.status !== 200) {
          client.send(JSON.stringify({
            type: 'validate-vps-error',
            error: `${response.status}: ${response.statusText}`
          }))
          return
        }

        const serverTypes = await response.json()

        if (serverTypes.error) {
          client.send(JSON.stringify({
            type: 'validate-vps-error',
            error: `${serverTypes.error.code}: ${serverTypes.error.message}`
          }))
        } else {
          // Filter down to relevant server types
          const relevantServerTypes = serverTypes.server_types.filter(serverType => {
            // Flag the recommended server.
            if (serverType.name === 'cpx11') serverType.description = 'CPX 11 (recommended)'

            return Boolean(serverType.deprecated) === false && parseInt(serverType.cores) > 1 && serverType.storage_type === 'local'
          })

          // Get locations
          const locations = (await (await fetch('https://api.hetzner.cloud/v1/locations?per_page=50', {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${db.settings.vps.apiToken}`
            }
          })).json()).locations
          // TODO: Handle error here also.

          // Get images
          const _images = (await (await fetch('https://api.hetzner.cloud/v1/images?type=system&status=available&include_deprecated=false&per_page=50', {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${db.settings.vps.apiToken}`
            }
          })).json()).images
          // TODO: Handle error here also.

          const images = _images.filter(image => {
            if (image.name === 'ubuntu-20.04') {
              image.description = 'Ubuntu 20.04 (recommended)'
            }

            // All system images appear to be rapid deploy at the moment, but just in case.
            return image.rapid_deploy === true
          })

          // Get SSH keys
          const sshKeys = (await (await fetch('https://api.hetzner.cloud/v1/ssh_keys?per_page=50', {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${db.settings.vps.apiToken}`
            }
          })).json()).ssh_keys
          // TODO: Handle error here also.

          const details = {
            serverTypes: relevantServerTypes,
            locations,
            images,
            sshKeys
          }

          client.send(JSON.stringify({
            type: 'validate-vps',
            details
          }))
        }

      break

      case 'validate-dns':
        console.log('   📡️    ❨Basil❩ Validating DNS Provider settings.')
        const retrieveDomainUrl = `https://api.dnsimple.com/v2/${db.settings.dns.accountId}/domains/${db.settings.dns.domain}`
        const dnsAccountDetails = await (await fetch(retrieveDomainUrl, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${db.settings.dns.accessToken}`
          }
        })).json()

        if (dnsAccountDetails.message) {
          // Something went wrong (most likely an authentication failure)
          client.send(JSON.stringify({
            type: 'validate-dns-error',
            error: dnsAccountDetails.message
          }))
        } else {
          // Send the account details.
          client.send(JSON.stringify({
            type: 'validate-dns'
          }))
        }
      break

      case 'create-server':
        console.log('=====================================================================')
        console.log('Creating server…')
        console.log(message)

        // TODO: Handle errors in VPS / DNS service constructors.
        const webHost = new HetznerCloud.Client(db.settings.vps.apiToken)
        const dnsHost = dnsimple({
          accessToken: db.settings.dns.accessToken
        })

        const subdomain = message.domain
        const app = parseInt(message.app)

        let cloudInit = db.settings.apps[app].cloudInit
        cloudInit = cloudInit.replace('{{SSH_KEY}}', db.settings.vps.sshKey)
        cloudInit = cloudInit.replace('{{SUBDOMAIN}}', subdomain)
        console.log(cloudInit)

        // 1. Check that the subdomain doesn’t already exist on the DNS.
        // TODO

        // 2. Create the server and store the returned IP address.
        //
        // Note: while the Hetzner API documentation states that the
        // ===== sshKey provided in the call is optional, if it is not
        //       provided (a) a root password is set (which we don’t want)
        //       and the sudo account creation fails during cloud-config/cloud-init.
        let serverBuildResult
        try {
          serverBuildResult = await webHost.servers.build()
          .name(`${subdomain}.small-web.org`)
          .serverType(db.settings.vps.serverType)
          .location(db.settings.vps.location)
          .image(db.settings.vps.image)
          .sshKey(db.settings.vps.sshKeyName)
          .userData(cloudInit)
          .create()
        } catch (error) {
          console.log('Create server VPS error', error)
          client.send(JSON.stringify({
            type: 'create-server-vps-error',
            error
          }))
          return
        }

        console.log('serverBuildResult', serverBuildResult)

        // TODO: Check that the response is exactly as we expect it to be.
        // (The shape of the .server and .action properties.)

        if (serverBuildResult.action.status === 'error') {
          client.send(JSON.stringify({
            type: 'create-server-vps-error',
            error: action.error
          }))
          return
        }

        console.log(' - Server initialising.')

        client.send(JSON.stringify({
          type: 'create-server-progress',
          provider: 'vps',
          status: 'initialising',
          progress: serverBuildResult.action.progress,
          finished: serverBuildResult.action.finished
        }))

        // We’ve got the initial result that the server is initialising.
        // Before polling for whether that’s complete, let’s also set up
        // the domain entry so we can get that out of the way as soon as
        // possible.

        console.log(' - Setting up the domain name…')

        client.send(JSON.stringify({
          type: 'create-server-progress',
          provider: 'dns',
          status: 'initialising'
        }))

        const publicNet = serverBuildResult.server.publicNet
        const ipv4 = publicNet.ipv4.ip
        const ipv6 = publicNet.ipv6.ip

        // 3. Create an A record for the subdomain that points to the server’s IP address.
        // TODO: ALso create AAAA record for the ipv6
        // Create zone record
        let dnsZoneCreationResponse
        try {
          dnsZoneCreationResponse = await dnsHost.zones.createZoneRecord(
            accountId = db.settings.dns.accountId,
            domainId = db.settings.dns.domain,
            attributes = {name: subdomain, type: 'A', content: ipv4, ttl: 60}
          )
          console.log(dnsZoneCreationResponse)
        } catch (error) {
          console.log('Create server DNS error', error)
          client.send(JSON.stringify({
            type: 'create-server-dns-error',
            error
          }))
          return
        }

        console.log(' - Domain name created.')

        // Poll the returned server creation action and provide progress messages
        // ===== and only continue once progress is 100%.

        let serverBuildSuccess = false
        while (!serverBuildSuccess) {
          const action = await webHost.actions.get(serverBuildResult.action.id)
          if (action.status === 'error') {
            client.send(JSON.stringify({
              type: 'create-server-vps-error',
              error: action.error
            }))
            break
          }
          client.send(JSON.stringify({
            type: 'create-server-progress',
            provider: 'vps',
            status: action.status,
            progress: action.progress,
            finished: action.finished
          }))
          serverBuildSuccess = (action.status === 'success')
        }

        console.log(' - Server is ready.')

        client.send(JSON.stringify({
          type: 'create-server-progress',
          provider: 'all',
          status: 'done'
        }))

        // That’s it. From here on, it’s up to the client to poll for the domain to become
        // reachable and for the app to complete installing.
      break

      default:
        console.log(`Warning: received unexpected message type: ${message.type}`)
    }
  })

  if (password !== db.admin.password) {
    console.log(`   ⛔️    ❨Basil❩ Unauthorised password: ${password}`)
    client.send(JSON.stringify({
      type: 'error',
      body: 'Error: unauthorised.'
    }))
    client.close()
  } else {
    console.log(`   🔓️    ❨Basil❩ Authorised password: ${password}`)
    client.send(JSON.stringify({
      type: 'settings',
      body: db.settings
    }))
    // this.broadcast(client, `There’s been a new login from ${request._remoteAddress}`)
  }
}

if (db.settings === undefined) {
  // Dummy data for now.
  db.settings = {
    org: {
      name: '',
      address: '',
      site: '',
      email: ''
    },

    site: {
      name: 'Small-Web.org',
      header: `<a href='https://small-tech.org/research-and-development'>Small Web</a> host.`,
      footer: `Your organisation. Privacy Policy. etc.`
    },

    // Note: these will be arrays later on to accommodate other providers.
    payment: {
      provider: 0,
      providers: [
        {
          name: 'None',
          modes: null
        },
        {
          name: 'Access Codes',
          modes: null,
          codes: []
        },
        {
          name: 'Stripe',
          modes: ['test', 'live'],
          mode: 'test',
          modeDetails: [
            {
              id: 'test',
              title: 'Test settings',
              publishableKey: 'pk_test_mLQRpGuO7qq3XMfSgwmt4n8U00FSZOIY1h',
              secretKey: 'notreallymysecretstripetestingkey',
              productId: 'notarealtestproductid',
              priceId: 'notarealtestpriceid'
            },
            {
              id: 'live',
              title: 'Live settings',
              publishableKey: 'pk_live_CYYwSVoh2kC4XcTPCudVIocg005StHQ47e',
              secretKey: 'notreallymysecretstripelivekey',
              productId: 'notarealliveproductid',
              priceId: 'notareallivepriceid'
            }
          ],
          // Note: as we progress, we will likely get this from the Stripe API
          // instead of redundantly declaring it here.
          currency: '€',
          price: 15,
        }
      ]
    },

    dns: {
      domain: 'small-web.org',
      provider: 'DNSimple',
      accountId: '000000',
      accessToken: 'asecretaccesstoken'
    },

    vps: {
      provider: 'Hetzner',
      apiToken: '',
      sshKeyName: '',
      sshKey: '',
      serverType: 'cpx11',
      location: 'hel1',
      image: 'ubuntu-20.04',
      cloudInit: `#cloud-config

  # Configures a basic Site.js server.
  write_files:
  - path: /home/site/public/index.html
    permissions: '0755'
    content: |
      <!DOCTYPE html>
      <html lang='en'>
      <title>Welcome to the Small Web!</title>
      <h1>Welcome to your Small Web site powered by Site.js.</h1>

  users:
  - name: site
    gecos: Site.JS
    sudo: ALL=(ALL) NOPASSWD:ALL
    lock_passwd: true
    ssh_authorized_keys:
      - {{sshKey}}
    groups: sudo
    shell: /bin/bash

  disable_root: true

  runcmd:
  - ufw allow OpenSSH
  - ufw enable
  - ufw allow 80/tcp
  - ufw allow 443/tcp
  - chown -R site:site /home/site
  - hostnamectl set-hostname {{subdomain}}.small-web.org
  - su site -c 'wget -qO- https://sitejs.org/install | bash'
  - su site -c 'mkdir /home/site/public'
  - su site -c 'site enable /home/site/public --skip-domain-reachability-check --ensure-can-sync'

  final_message: "Welcome to your Small Web site powered by Site.js. Setup took $UPTIME seconds."
      `
    }
  }
}
