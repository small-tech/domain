console.log('>>>>>>>>>> HOOKS LOADED <<<<<<<<<<<<<<<')

export async function handle({ request, resolve }) {

  console.log('======================== request =============================', request)

  const response = await resolve(request)

  console.log('======================== response =============================', response)

  return response
}

