"""Run against a disposable public-mode deployment: API_URL=http://... python smoke_public.py."""
import json
import os
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

BASE = os.environ['API_URL'].rstrip('/')

class PublicDeployment(unittest.TestCase):
    def call(self, path, method='GET'):
        req = Request(BASE + '/api' + path, method=method,
                      data=b'{}' if method == 'POST' else None,
                      headers={'Content-Type': 'application/json'})
        try:
            with urlopen(req, timeout=10) as response:
                return response.status, json.load(response)
        except HTTPError as error:
            return error.code, json.load(error)

    def test_health_and_database_readiness(self):
        for path in ['/health', '/ready']:
            status, body = self.call(path)
            self.assertEqual(status, 200)
            self.assertTrue(body['ok'])

    def test_personal_data_and_anonymous_writes_are_unavailable(self):
        for path, method in [('/profile/synthetic', 'GET'), ('/attendance/synthetic', 'GET'),
                             ('/profile', 'POST'), ('/attendance', 'POST'), ('/room-timetable', 'POST')]:
            with self.subTest(path=path, method=method):
                self.assertEqual(self.call(path, method)[0], 404)

    def test_rooms_are_labeled_estimates(self):
        status, body = self.call('/vacant-rooms')
        self.assertEqual(status, 200)
        self.assertIn(body['source'], (None, 'verified_schedule'))
        self.assertIsInstance(body['rooms'], list)
        self.assertEqual(body['timezone'], 'Asia/Kolkata')

if __name__ == '__main__':
    unittest.main()
