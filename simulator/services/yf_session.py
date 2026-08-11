from curl_cffi import requests

yf_session = requests.Session(
    impersonate="chrome"
)