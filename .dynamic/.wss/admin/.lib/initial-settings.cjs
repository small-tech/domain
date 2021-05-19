// Initial settings.

module.exports = {
  org: {
    name: '',
    address: '',
    site: '',
    email: ''
  },

  site: {
    name: 'A Small Web Host',
    header: `A <a href='https://small-tech.org/research-and-development'>Small Web</a> host.`,
    footer: `I am a <strike>teapot</strike> footer, short and sweet.`
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
            publishableKey: '',
            secretKey: '',
            productId: '',
            priceId: ''
          },
          {
            id: 'live',
            title: 'Live settings',
            publishableKey: '',
            secretKey: '',
            productId: '',
            priceId: ''
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
    provider: 'DNSimple',
    domain: '',
    accountId: '',
    accessToken: ''
  },

  vps: {
    provider: 'Hetzner',
    apiToken: '',
    sshKeyName: '',
    sshKey: '',
    serverType: 'cpx11',
    location: 'hel1',
    image: 'ubuntu-20.04'
  },

  apps: [
    {
      name: 'Site.js',
      link: 'https://sitejs.org',
      description: 'Small web construction set',
      logo: `<svg style="isolation:isolate" viewBox="670.5 289.149 519 354" width="519pt" height="354pt">
        <defs>
          <clipPath id="_clipPath_1gKyAklgrqjcuFFKZ1w6C5ZZ1kz7EE2Q">
            <rect x="670.5" y="289.149" width="100%" height="100%"/>
          </clipPath>
        </defs>
        <g clip-path="url(#_clipPath_1gKyAklgrqjcuFFKZ1w6C5ZZ1kz7EE2Q)">
          <g>
            <path d=" M 986.573 542.863 C 956.926 564.032 929.564 589.449 928.911 643.205 L 928.911 643.205 L 902.914 643.205 C 901.708 600.026 892.32 559.833 875.023 522.979 L 899.902 515.545 L 899.897 515.57 L 899.902 515.545 C 909.127 535.974 916.155 557.295 920.864 579.187 C 936.019 550.544 958.904 530.147 981.661 515.828 L 986.573 542.863 L 986.573 542.863 Z " fill="currentColor"/>
            <path d=" M 986.751 542.734 C 997.073 548.581 1033.076 567.187 1071.824 567.187 C 1084.12 567.187 1096.782 565.319 1108.87 560.531 C 1165.078 538.462 1186.252 464.269 1187.157 461.134 L 1189.739 451.712 L 1181.415 446.617 C 1178.64 444.949 1112.56 404.986 1056.402 427.104 C 1012.298 444.5 989.822 493.793 981.755 515.763 L 986.573 542.863 C 986.692 542.775 986.632 542.819 986.573 542.863 L 986.751 542.734 Z " fill="currentColor"/>
            <path d=" M 899.902 515.545 L 900.758 510.579 C 901.559 505.896 919.756 394.756 860.126 334.469 C 822.832 296.765 765.363 289.306 726.353 289.152 L 726.353 289.152 C 702.958 289.049 686.186 291.616 684.415 291.928 L 675.295 293.381 L 673.732 302.452 C 672.921 307.191 654.724 418.331 714.404 478.629 C 752.058 516.629 810.279 523.88 849.289 523.88 C 859.418 523.88 868.138 523.43 874.954 522.821 C 875.004 522.926 874.979 522.876 874.954 522.821 L 899.902 515.545 L 899.902 515.545 Z " fill="currentColor"/>
          </g>
        </g>
      </svg>`,
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

      final_message: "Welcome to your Small Web site powered by Site.js."
      `
    },
    {
      name: 'Owncast (with Site.js)',
      link: 'https://owncast.online',
      description: 'Owncast is a self-hosted, single-tenant live video and web chat server for use with existing popular broadcasting software',
      logo: `<svg width="100%" height="100%" viewBox="0 0 96 105" version="1.1" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;" class="svg-logo-solid">
        <g transform="matrix(1.04457,0,0,1.04457,-0.742448,-0.0626735)">
            <g>
                <path d="M91.5,75.35C92.533,72.55 92.583,70 91.65,67.7C90.783,65.567 89.117,63.767 86.65,62.3C84.35,60.967 81.567,60 78.3,59.4C75.333,58.867 72.1,58.633 68.6,58.7C65.233,58.8 61.967,59.167 58.8,59.8C55.767,60.433 53.1,61.233 50.8,62.2C48.533,63.167 46.767,64.217 45.5,65.35C44.233,66.55 43.567,67.783 43.5,69.05C43.4,70.55 44.167,72.167 45.8,73.9C47.3,75.5 49.4,77.067 52.1,78.6C54.8,80.133 57.783,81.45 61.05,82.55C64.55,83.717 68,84.467 71.4,84.8C73.6,85 75.65,85.033 77.55,84.9C79.617,84.7 81.533,84.267 83.3,83.6C85.2,82.867 86.817,81.85 88.15,80.55C89.65,79.117 90.767,77.383 91.5,75.35M70.6,67.5C71.733,68.1 72.567,68.833 73.1,69.7C73.633,70.667 73.75,71.767 73.45,73C73.217,73.867 72.833,74.617 72.3,75.25C71.8,75.817 71.133,76.267 70.3,76.6C69.6,76.9 68.75,77.117 67.75,77.25C66.783,77.35 65.817,77.367 64.85,77.3C63.15,77.2 61.283,76.867 59.25,76.3C57.483,75.767 55.783,75.1 54.15,74.3C52.65,73.567 51.417,72.8 50.45,72C49.517,71.167 49.067,70.433 49.1,69.8C49.167,69.267 49.55,68.75 50.25,68.25C50.95,67.783 51.917,67.367 53.15,67C54.383,66.6 55.75,66.3 57.25,66.1C58.95,65.9 60.567,65.8 62.1,65.8C63.8,65.833 65.333,65.967 66.7,66.2C68.167,66.5 69.467,66.933 70.6,67.5Z" style="fill:currentColor;fill-rule:nonzero;"/>
            </g>
            <g>
                <path d="M66.6,15.05C66.467,11.45 65.567,8.45 63.9,6.05C62.133,3.417 59.533,1.617 56.1,0.65C55.333,0.417 54.517,0.25 53.65,0.15C52.883,0.05 52.1,0.033 51.3,0.1C50.567,0.1 49.833,0.183 49.1,0.35C48.467,0.483 47.767,0.7 47,1C44.533,1.967 42.3,3.667 40.3,6.1C38.433,8.3 36.833,11.033 35.5,14.3C34.333,17.067 33.4,20.1 32.7,23.4C32.033,26.5 31.583,29.65 31.35,32.85C31.15,35.75 31.133,38.533 31.3,41.2C31.5,43.833 31.867,46.217 32.4,48.35C33.467,52.717 35.1,55.4 37.3,56.4C37.5,56.5 37.7,56.583 37.9,56.65L39.2,56.85C39.367,56.85 39.617,56.833 39.95,56.8C41.35,56.667 42.933,56.083 44.7,55.05C46.4,54.017 48.183,52.6 50.05,50.8C52.05,48.867 53.983,46.617 55.85,44.05C57.817,41.383 59.567,38.567 61.1,35.6C62.9,32.1 64.283,28.667 65.25,25.3C66.25,21.6 66.7,18.183 66.6,15.05M47.55,23.15C47.883,23.217 48.167,23.3 48.4,23.4C51.1,24.333 52.483,26.483 52.55,29.85C52.583,32.617 51.733,35.8 50,39.4C48.567,42.4 46.85,45.033 44.85,47.3C42.983,49.433 41.417,50.567 40.15,50.7L39.9,50.75L39.45,50.7L39.2,50.6C38.267,50.167 37.617,48.75 37.25,46.35C36.883,43.917 36.9,41.133 37.3,38C37.733,34.5 38.55,31.433 39.75,28.8C41.183,25.667 42.95,23.817 45.05,23.25C45.417,23.15 45.683,23.1 45.85,23.1C46.117,23.067 46.383,23.05 46.65,23.05C46.917,23.05 47.217,23.083 47.55,23.15Z" style="fill:currentColor;fill-rule:nonzero;"/>
            </g>
            <g>
                <path d="M2.7,33.6C2.3,34.133 1.967,34.717 1.7,35.35C1.4,36.117 1.183,36.9 1.05,37.7C0.35,40.967 0.733,44.133 2.2,47.2C3.4,49.733 5.333,52.117 8,54.35C10.367,56.317 13.033,57.917 16,59.15C19,60.383 21.617,60.95 23.85,60.85C24.283,60.85 24.75,60.8 25.25,60.7C25.75,60.6 26.167,60.467 26.5,60.3C26.833,60.133 27.15,59.917 27.45,59.65C27.75,59.383 27.983,59.083 28.15,58.75C28.95,57.217 28.733,54.85 27.5,51.65C26.233,48.55 24.317,45.367 21.75,42.1C19.083,38.7 16.3,36.017 13.4,34.05C10.267,31.95 7.617,31.167 5.45,31.7C4.917,31.833 4.417,32.067 3.95,32.4C3.483,32.7 3.067,33.1 2.7,33.6M10.1,43.55C10.267,43.25 10.433,43.017 10.6,42.85C10.767,42.683 10.967,42.533 11.2,42.4C11.467,42.3 11.7,42.233 11.9,42.2C12.967,42 14.317,42.467 15.95,43.6C17.417,44.567 18.883,45.933 20.35,47.7C21.683,49.3 22.75,50.867 23.55,52.4C24.317,53.967 24.55,55.067 24.25,55.7C24.183,55.833 24.1,55.933 24,56C23.9,56.133 23.783,56.217 23.65,56.25C23.583,56.317 23.45,56.367 23.25,56.4L22.7,56.5C21.633,56.567 20.25,56.267 18.55,55.6C16.883,54.933 15.317,54.05 13.85,52.95C12.283,51.783 11.117,50.517 10.35,49.15C9.483,47.583 9.283,46.017 9.75,44.45C9.85,44.117 9.967,43.817 10.1,43.55Z" style="fill:currentColor;fill-rule:nonzero;"/>
            </g>
            <g>
                <path d="M34.95,74.2L34.75,74.2C33.717,74.167 32.767,74.517 31.9,75.25C31.1,75.95 30.417,76.95 29.85,78.25C29.35,79.417 29,80.733 28.8,82.2C28.6,83.667 28.567,85.15 28.7,86.65C28.967,89.817 29.9,92.5 31.5,94.7C33.367,97.233 35.967,98.9 39.3,99.7L39.4,99.7L39.7,99.8L39.85,99.8C43.483,100.5 45.917,99.817 47.15,97.75C47.717,96.783 48,95.55 48,94.05C47.967,92.617 47.7,91.05 47.2,89.35C46.7,87.617 46,85.883 45.1,84.15C44.2,82.383 43.183,80.783 42.05,79.35C40.85,77.85 39.65,76.65 38.45,75.75C37.183,74.817 36.017,74.3 34.95,74.2M33.55,80.4C34.083,78.933 34.767,78.233 35.6,78.3L35.65,78.3C36.483,78.4 37.467,79.267 38.6,80.9C39.733,82.533 40.583,84.25 41.15,86.05C41.783,88.017 41.917,89.583 41.55,90.75C41.117,91.983 40.05,92.483 38.35,92.25L38.3,92.25L38.25,92.2L38.1,92.2C36.433,91.867 35.15,91 34.25,89.6C33.483,88.333 33.05,86.8 32.95,85C32.85,83.233 33.05,81.7 33.55,80.4Z" style="fill:currentColor;fill-rule:nonzero;"/>
            </g>
            <g>
                <path d="M22.7,69.65C22.4,69.417 22.033,69.217 21.6,69.05C21.167,68.883 20.717,68.767 20.25,68.7C19.817,68.6 19.35,68.533 18.85,68.5C17.417,68.467 16.017,68.683 14.65,69.15C13.317,69.583 12.233,70.233 11.4,71.1C10.567,72.033 10.167,73.067 10.2,74.2C10.233,75.433 10.817,76.767 11.95,78.2C12.25,78.567 12.617,78.967 13.05,79.4C13.383,79.733 13.767,80.033 14.2,80.3C14.533,80.5 14.9,80.683 15.3,80.85C15.767,81.017 16.133,81.1 16.4,81.1C17.6,81.267 18.767,81.017 19.9,80.35C21,79.717 21.95,78.817 22.75,77.65C23.583,76.45 24.1,75.217 24.3,73.95C24.5,72.55 24.25,71.4 23.55,70.5C23.283,70.167 23,69.883 22.7,69.65M21.7,71.7C22,72.1 22.067,72.633 21.9,73.3C21.767,73.933 21.467,74.583 21,75.25C20.533,75.883 20,76.383 19.4,76.75C18.767,77.15 18.15,77.317 17.55,77.25L17,77.15C16.8,77.083 16.617,76.983 16.45,76.85C16.317,76.783 16.133,76.65 15.9,76.45C15.767,76.317 15.6,76.133 15.4,75.9C14.8,75.133 14.567,74.433 14.7,73.8C14.767,73.233 15.117,72.733 15.75,72.3C16.317,71.9 17,71.6 17.8,71.4C18.6,71.2 19.367,71.117 20.1,71.15L20.65,71.2L21.1,71.3C21.233,71.367 21.35,71.433 21.45,71.5L21.7,71.7Z" style="fill:currentColor;fill-rule:nonzero;"/>
            </g>
        </g>
    </svg>`,
      cloudInit: `#cloud-config

      # Set up an unprivileged account with passwordless sudo access.
      users:
      - name: site
        gecos: Site.JS
        sudo: ALL=(ALL) NOPASSWD:ALL
        lock_passwd: true
        ssh_authorized_keys:
          - {{SSH_KEY}}
        groups: sudo
        shell: /bin/bash

      disable_root: true

      runcmd:
      - ufw allow OpenSSH
      - ufw enable
      - ufw allow 80/tcp
      - ufw allow 443/tcp
      - chown -R site:site /home/site
      - hostnamectl set-hostname {{SUBDOMAIN}}.small-web.org
      - su site -c 'wget -qO- https://sitejs.org/install | bash'
      - su site -c 'site enable --owncast --skip-domain-reachability-check --ensure-can-sync'

      final_message: "Welcome to your Owncast instance powered by Site.js."
      `
    },
    {
      name: 'Place + Henry (work-in-progress)',
      link: 'https://github.com/small-tech/place',
      description: 'Prototype Small Web server and client.',
      logo: '<svg></svg>',
      cloudInit: ''
    }
  ]
}
