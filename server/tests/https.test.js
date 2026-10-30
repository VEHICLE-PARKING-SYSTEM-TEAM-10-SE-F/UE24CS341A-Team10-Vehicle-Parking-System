// SEC-04: HTTPS with TLS 1.2 or higher; plain HTTP is redirected (TC-SEC-04, automated part).
// The scan of the deployed server with testssl.sh / SSL Labs is done on the test environment.
const http = require('http');
const https = require('https');
const tls = require('tls');
const request = require('supertest');
const selfsigned = require('selfsigned');
const { createApp } = require('../src/app');
const { TLS_OPTIONS, redirectToHttps } = require('../src/server');

let server;
let port;

beforeAll(async () => {
  const pems = await selfsigned.generate([{ name: 'commonName', value: 'localhost' }], { days: 1, keySize: 2048 });
  server = https.createServer({ ...TLS_OPTIONS, key: pems.private, cert: pems.cert }, createApp({ requireHttps: true }));
  await new Promise((resolve) => server.listen(0, resolve));
  port = server.address().port;
});
afterAll(() => new Promise((resolve) => server.close(resolve)));

function handshake(version) {
  return new Promise((resolve) => {
    const socket = tls.connect({ port, host: '127.0.0.1', rejectUnauthorized: false, minVersion: version, maxVersion: version }, () => {
      const used = socket.getProtocol();
      socket.end();
      resolve(used);
    });
    socket.on('error', () => resolve('refused'));
  });
}

it('accepts TLS 1.2 and TLS 1.3', async () => {
  expect(await handshake('TLSv1.2')).toBe('TLSv1.2');
  expect(await handshake('TLSv1.3')).toBe('TLSv1.3');
});

it('refuses TLS 1.0 and TLS 1.1', async () => {
  expect(await handshake('TLSv1')).toBe('refused');
  expect(await handshake('TLSv1.1')).toBe('refused');
});

it('serves the API over HTTPS with an HSTS header', async () => {
  const res = await new Promise((resolve, reject) => {
    https.get({ port, host: '127.0.0.1', path: '/api/v1/health', rejectUnauthorized: false }, resolve).on('error', reject);
  });
  expect(res.statusCode).toBe(200);
  expect(res.headers['strict-transport-security']).toMatch(/max-age=31536000/);
  res.resume();
});

it('plain HTTP is redirected to HTTPS', async () => {
  const plain = http.createServer(redirectToHttps(5443));
  const res = await request(plain).get('/api/v1/health').set('Host', 'parking.example.com');
  expect(res.status).toBe(301);
  expect(res.headers.location).toBe('https://parking.example.com:5443/api/v1/health');
});

it('behind the proxy, an HTTP request is redirected (GET) or refused (POST)', async () => {
  const app = createApp({ requireHttps: true, trustProxy: true });
  const get = await request(app).get('/api/v1/health').set('X-Forwarded-Proto', 'http').set('Host', 'parking.example.com');
  expect(get.status).toBe(301);
  expect(get.headers.location).toBe('https://parking.example.com/api/v1/health');
  const post = await request(app).post('/api/v1/auth/login').set('X-Forwarded-Proto', 'http').send({ username: 'a', password: 'b' });
  expect(post.status).toBe(403);
  expect(post.body.error.code).toBe('HTTPS_REQUIRED');
  const ok = await request(app).get('/api/v1/health').set('X-Forwarded-Proto', 'https');
  expect(ok.status).not.toBe(301);
});
