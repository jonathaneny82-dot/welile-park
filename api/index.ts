import app, { initServerless } from '../server';

export default async function handler(req: any, res: any) {
  await initServerless();
  return app(req, res);
}
