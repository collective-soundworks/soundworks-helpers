/**
 * Returns the browser client configuration as retrieved by the server
 * @returns {ClientConfig}
 */
export default function browserLoadConfig() {
  return window.SOUNDWORKS_CONFIG;
}
