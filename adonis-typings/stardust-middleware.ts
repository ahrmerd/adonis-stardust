import { HttpContext } from "@adonisjs/core/http";

// declare module 'EidelLev/Stardust/Middleware' {

  declare class StardustMiddleware {
    public handle(ctx: HttpContext, next: () => Promise<void>);
  // }
}

export {StardustMiddleware as default}
