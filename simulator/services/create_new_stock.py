from pathlib import Path
import re

BASE_DIR = Path(__file__).resolve().parent.parent

TOPSTOCKS_PY = BASE_DIR / "static" / "simulator" / "top_stocks.py"
TOPSTOCKS_JS = BASE_DIR / "static" / "simulator" / "js" / "top_stocks.js"

def add_stock_to_supported_lists(symbol):
    symbol = symbol.strip().upper()

    if not symbol:
        return 

    # Update top stocks

    py_text = TOPSTOCKS_PY.read_text(encoding="utf-8")

    py_match = re.search(
        r"TOP_STOCKS\s*=\s*\[(.*?)\]",
        py_text,
        re.DOTALL,
    )

    if not py_match:
        raise RuntimeError("TOP_STOCKS was not found in top_stocks.py")

    py_block = py_match.group(1)

    if f'"{symbol}"' not in py_block:
        new_py_block = py_block.rstrip() + f'\n"{symbol}",\n'

        py_text = (
            py_text[:py_match.start(1)]
            + new_py_block
            + py_text[py_match.end(1):]
        )

        TOPSTOCKS_PY.write_text(py_text, encoding="utf-8")


    #update topstocks.js

    js_text = TOPSTOCKS_JS.read_text(encoding="utf-8")

    js_match = re.search(
        r"window\.TOP_STOCKS\s*=\s*\[(.*?)\]",
        js_text,
        re.DOTALL,
    )

    if not js_match:
        raise RuntimeError("window.TOP_STOCKS was not found in topstocks.js.")

    js_block = js_match.group(1)

    if f'"{symbol}"' not in js_block:
        new_js_block = js_block.rstrip() + f'\n"{symbol}",\n'

        js_text = (
            js_text[:js_match.start(1)]
            + new_js_block
            + js_text[js_match.end(1):]
        )

        TOPSTOCKS_JS.write_text(js_text, encoding="utf-8")

