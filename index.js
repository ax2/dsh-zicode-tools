/**
 * Zicode tools — Host half.
 *
 * The toolbox is a pure browser surface: every tool runs locally in the page
 * and nothing is sent to a model or a network service. This half only keeps
 * the bundle row active so the Client entry declared in `package.json`
 * (`dsh.client`) is composed and loaded by the Web shell.
 */

/** No Host service, tool, or event is registered. */
export function apply() {}
