import urllib.request
import re

url = "https://rank.qmaths.in/rrb/notification/alp-cen-01-2026-pdf-download"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8', errors='ignore')
        imgs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html)
        print("Found images:", imgs[:10])
except Exception as e:
    print("Error:", e)
