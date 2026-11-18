"""Check the actual quiz payload from many simultaneous loopback clients.

Usage: ulimit -n 8192; python tools/load_test.py --clients 1000 --waves 3
Run the project server first with a raised file-descriptor limit: ulimit -n 8192; node serve.mjs
"""
from argparse import ArgumentParser
import asyncio
import gzip
from hashlib import sha256
from pathlib import Path
from statistics import median
from time import perf_counter

ROOT = Path(__file__).resolve().parent.parent
EXPECTED = sha256((ROOT / 'site' / 'index.html').read_bytes()).digest()


async def fetch(connection, port):
    reader, writer = connection
    start = perf_counter()
    try:
        writer.write((f'GET / HTTP/1.1\r\nHost: 127.0.0.1:{port}\r\n'
                      'Accept-Encoding: gzip\r\nConnection: close\r\n\r\n').encode('ascii'))
        await writer.drain()
        message = await asyncio.wait_for(reader.read(), 15)
        return (perf_counter() - start) * 1000, message
    finally:
        writer.close()
        await writer.wait_closed()


def validate(message):
    head, _, body = message.partition(b'\r\n\r\n')
    lines = head.decode('iso-8859-1').split('\r\n')
    assert lines[0].split()[1] == '200', lines[0]
    headers = dict((key.lower(), value.strip()) for key, value in (line.split(':', 1) for line in lines[1:]))
    assert headers.get('content-encoding') == 'gzip', headers
    assert len(body) == int(headers['content-length']), 'Incomplete response'
    assert sha256(gzip.decompress(body)).digest() == EXPECTED, 'Response does not match the built website'


async def run(port, count, waves):
    times = []
    errors = []
    for wave in range(1, waves + 1):
        # Hold every connection open before releasing the requests in the same burst.
        start = perf_counter()
        connected = await asyncio.gather(*[asyncio.wait_for(asyncio.open_connection('127.0.0.1', port), 15) for _ in range(count)], return_exceptions=True)
        active = [c for c in connected if not isinstance(c, BaseException)]
        connection_ms = (perf_counter() - start) * 1000
        release = perf_counter()
        responses = await asyncio.gather(*(fetch(c, port) for c in active), return_exceptions=True)
        duration = (perf_counter() - release) * 1000
        failures = [str(c) for c in connected if isinstance(c, BaseException)]
        for item in responses:
            if isinstance(item, BaseException):
                failures.append(str(item))
                continue
            elapsed, response = item
            try:
                validate(response)
                times.append(elapsed)
            except (AssertionError, IndexError, KeyError, ValueError, OSError) as error:
                failures.append(str(error))
        errors.extend(failures)
        print(f'Wave {wave}: {count - len(failures)}/{count} verified HTTP 200 responses; '
              f'{len(active)} simultaneous connections ready in {connection_ms:.0f} ms, '
              f'response burst finished in {duration:.0f} ms.')
    if times:
        ordered = sorted(times)
        p95 = ordered[(95 * len(ordered) + 99) // 100 - 1]
        print(f'{len(times)}/{count * waves} successful, {len(errors)} failures. '
              f'Full-response latency: median {median(times):.0f} ms, p95 {p95:.0f} ms, max {max(times):.0f} ms.')
    if errors:
        for error in errors[:5]:
            print(f'Failure: {error}')
        raise SystemExit(1)


if __name__ == '__main__':
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=3000)
    parser.add_argument('--clients', type=int, default=150)
    parser.add_argument('--waves', type=int, default=3)
    args = parser.parse_args()
    if not 1 <= args.clients <= 1000 or not 1 <= args.waves <= 10 or not 1 <= args.port <= 65535:
        parser.error('Use 1–1000 clients, 1–10 waves, and a valid local port.')
    asyncio.run(run(args.port, args.clients, args.waves))
