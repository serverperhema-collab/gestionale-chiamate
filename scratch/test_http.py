import urllib.request
import json

url = "http://localhost:3000/api/tl/contacts/cmtqcu89w0005hdu29eogi0qt"
req = urllib.request.Request(url)
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode())
except Exception as e:
    print(f"Error: {e}")
