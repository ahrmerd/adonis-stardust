import StardustMiddleware from '../middleware/Stardust.js';
import { ApplicationService } from '@adonisjs/core/types';
import edge from 'edge.js';
/*
|--------------------------------------------------------------------------
| Stardust Provider
|--------------------------------------------------------------------------
*/
export default class StardustProvider {
  constructor(protected app: ApplicationService) {}
  public static needsApplication = true;

  /**
   * Returns list of named routes
   */
  private async getNamedRoutes() {
    /**
     * Only sharing the main domain routes. Subdomains are
     * ignored for now. Let's see if many people need it
     */
    const router = await this.app.container.make('router');
    const mainDomainRoutes = router.toJSON()?.['root'] ?? [];

    return mainDomainRoutes.reduce<Record<string, string>>((routes, route) => {
      if (route.name) {
        routes[route.name] = route.pattern;
      } else if (typeof route.handler === 'string') {
        routes[route.handler] = route.pattern;
      }

      return routes;
    }, {});
  }

  /**
   * Register the `@routes()` tag
   */

  private registerStardustTag() {
    edge.registerTag({
      block: false,
      tagName: 'routes',
      seekable: false,
      compile(_, buffer, token) {
        buffer.writeExpression(
          `\n
          out += template.sharedState.routes(template.sharedState.cspNonce)
          `,
          token.filename,
          token.loc.start.line,
        );
      },
    });
  }

  private registerRoutesGlobal(namedRoutes: Record<string, string>) {
    edge.global('routes', (cspNonce?: string) => {
      return `
<script${cspNonce ? ` nonce="${cspNonce}"` : ''}>
  (globalThis || window).stardust = {namedRoutes: ${JSON.stringify(namedRoutes)}};
</script>
      `;
    });
  }

  /**
   * Registers named routes on the global scope in order to seamlessly support
   * stardust's functionality on the server
   * @param namedRoutes
   */
  private registerSsrRoutes(namedRoutes: Record<string, string>) {
    globalThis.stardust = { namedRoutes };
  }

  public async ready() {
    this.app.container.bind(StardustMiddleware, () => new StardustMiddleware());
    // this.app.container.bind()
    const namedRoutes = await this.getNamedRoutes();

    this.registerRoutesGlobal(namedRoutes);
    this.registerStardustTag();
    this.registerSsrRoutes(namedRoutes);
    // this.app.container.withBindings(['Adonis/Core/View', 'Adonis/Core/Route'], (View, Route) => {
    // });
  }
}
