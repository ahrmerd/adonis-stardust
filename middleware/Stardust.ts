import { HttpContext } from "@adonisjs/core/http";


export default class StardustMiddleware {
  public async handle({ request }: HttpContext, next: () => Promise<void>) {
    const { pathname } = new URL(request.completeUrl());

    globalThis.stardust = {
      ...globalThis.stardust,
      pathname,
    };

    await next();
  }
}
