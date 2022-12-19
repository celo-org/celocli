declare module '@celo/ganache-cli' {
  import { ConnectorsByName, ServerOptions } from 'ganache'
  import _ganache from '@celo/ganache-cli';
  type Server = {
    listen: (port: number, cb: (err: Error, blockhain: string) => void) => void;
    close: (cb: (err: Error) => void) => void;
  }
  type Ganache = {
    server: <T extends keyof ConnectorsByName = "ethereum">(options?: ServerOptions<T>) => Server;
  }
  const ganache : Ganache = _ganache;
  export default ganache;
}
