# -*- coding: utf-8 -*-
"""提交檔工具：產生空白範本、檢查提交檔格式（只需要 Python 3 標準函式庫）。

用法
----
  1. 產生空白範本：涵蓋全部測試影像，每張先填空陣列，再把預測寫進去
         python make_submission.py --template my_submission.json

  2. 檢查格式：送出前先自我檢查，避免因格式問題被退件
         python make_submission.py --check my_submission.json

  兩種用法都需要測試影像清單 test_images.csv。未指定 --test-images 時，依序在
  「make_submission.py 所在的資料夾」與「目前的工作目錄」尋找；放在其他位置時
  請用 --test-images 指定，例如：
         python make_submission.py --check my_submission.json --test-images 路徑/test_images.csv

  --template 不會覆寫已存在的檔案；確定要覆寫時請加上 --force。

  結束碼：0 = 格式檢查通過（或範本已產生）
          1 = 格式有問題，評分程式會退件
          2 = 無法執行（找不到檔案、清單內容不正確等）

--check 的接受／退件條件，與 AIdea 平台評分程式讀入提交檔與格式檢查的條件
完全一致（條件列表見 README.md 第 9.1 節）。通過只代表格式正確、可以被正常評分，
不代表分數高低。另外會列出幾項「提醒」，提醒不影響通過與否。

提交檔格式
----------
單一 JSON 檔（UTF-8 編碼、不含 BOM），最外層是物件：以測試影像路徑為 key，
值為該影像的預測物件陣列。

{
  "test/EO/image/test_164.jpg": [
    {"label": "solar_panel", "points": [[470.0, 200.0], [730.0, 200.0], [730.0, 620.0], [470.0, 620.0]]},
    {"label": "crack", "points": [[740.0, 200.0], [1000.0, 200.0], [1000.0, 620.0], [740.0, 620.0]],
     "reason": "（示範文字）請填入該模組的異常成因說明。"}
  ],
  "test/IR/image/test_164.jpg": [
    {"label": "solar_panel", "points": [[140.0, 120.0], [250.0, 300.0]]},
    {"label": "hotspot", "points": [[265.0, 120.0], [375.0, 120.0], [375.0, 300.0], [265.0, 300.0]],
     "reason": "（示範文字）請填入該模組的異常成因說明。"}
  ],
  "test/IR/image/test_101.jpg": []
}

上例中的座標與文字只用來示範欄位格式，不是標註範例（框刻意放在影像中沒有模組的位置，
直接上傳的分數為 0）；實際提交時，可用 --template 產生涵蓋全部測試影像的範本。

  key     測試影像路徑，須與 test_images.csv 中的字串完全一致（大小寫、斜線方向都要相同）。
          未列出的影像視為沒有任何偵測結果；沒有偵測結果的影像也可以寫空陣列 []。
  label   solar_panel / hotspot / crack 三者之一（全小寫）。
  points  多邊形頂點 [x, y]，2～100 個點，像素座標，原點在左上角；座標須為數值。
          只給 2 個點時，視為以這兩點為對角的矩形（如上例 IR 影像的 solar_panel）。
  reason  根因說明文字，單一字串，最多 500 字元（空白與標點也計入）。
          hotspot 與 crack 應填寫（缺漏或 null 不會退件，但配對成功時單句分數記 0）；
          solar_panel 不需要，填了也不會被讀取。
          欄位名稱必須是全小寫的 reason；寫在 root_cause、Reason 等其他欄位的文字不會被讀取。
          reason 缺漏、為 null，或去除前後空白後為空（例如空字串、只有半形或全形
          空白、換行、Tab），都視為空白：格式檢查會通過；這個框配對成功時，該筆的
          單句分數記為 0，並計入所屬成因類別的平均。
          reason 只含零寬空白（U+200B）等不可見字元時，不會被視為空白：仍會送去
          計算 BERTScore，可能得到很低的負分。
          請以中文撰寫，建議使用繁體中文。
  其他欄位（例如 labelme 的 shape_type、group_id）會被忽略，不影響評分。

框選方式
--------
  hotspot 與 crack 請框出「整個模組」，與 solar_panel 一樣以單一模組為範圍；
  不要把異常框畫在 solar_panel 框的內部。同一個模組只標一個類別：
  異常模組標成 hotspot 或 crack，不要再另外標一個 solar_panel（如上例）。

  沒有 confidence 欄位。所有送出的框都計入定位分數；根因文字只對配對成功者計分。
  評分方式詳見 README.md。

格式上限（任一項不符即退件）
----------------------------
  檔案大小         50 MB（52,428,800 位元組）以內
  每張影像物件數   500 個以內
  總物件數         400,000 個以內
  每個多邊形頂點   2～100 個，每個頂點為 [x, y]
  座標             數值（不可為字串、null、true/false），絕對值不超過 1,000,000
  label            solar_panel / hotspot / crack 三者之一
  key              必須在 test_images.csv 中
  reason           hotspot、crack 的 reason 須為字串（或省略、null），500 字元以內；
                   solar_panel 的 reason 不檢查
  檔案編碼         UTF-8、不含 BOM 的合法 JSON
  特殊數值         座標不可溢位成無限大（例如 1e400）；NaN、Infinity、-Infinity
                   出現在檔案任何位置都會退件（包括會被忽略的欄位）
"""
import argparse
import collections
import csv
import json
import math
import os
import sys
import unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
TEST_LIST_NAME = "test_images.csv"

# 以下上限與 AIdea 平台評分程式相同（見 README.md 第 3.2、9.1 節）
CLASSES = ("solar_panel", "hotspot", "crack")
ANOMALY = ("hotspot", "crack")
MAX_BYTES = 50 * 1024 * 1024
MAX_OBJECTS_PER_IMAGE = 500
MAX_TOTAL_OBJECTS = 400000
MAX_VERTICES = 100
MIN_VERTICES = 2
MAX_REASON_CHARS = 500
COORD_ABS_LIMIT = 1e6

EXIT_OK = 0
EXIT_FORMAT = 1
EXIT_USAGE = 2

MAX_EXAMPLES = 3
KNOWN_FIELDS = ("label", "points", "reason")


# ---------------------------------------------------------------- 共用小工具

def _safe_streams():
    """避免 Windows cp950 主控台或導向檔案時，因無法編碼的字元而中斷。"""
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(errors="replace")
        except Exception:
            pass


def _jtype(v):
    """以 JSON 的型別名稱描述一個值。"""
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "布林值"
    if isinstance(v, (int, float)):
        return "數字"
    if isinstance(v, str):
        return "字串"
    if isinstance(v, list):
        return "陣列"
    if isinstance(v, dict):
        return "物件"
    return type(v).__name__


def _actual(v):
    t = _jtype(v)
    return ("實際是 " if all(ord(c) < 128 for c in t) else "實際是") + t


def _clip(s, n=60):
    s = str(s)
    return s if len(s) <= n else s[:n] + "..."


def _show_value(v):
    """簡短顯示一個值；非字串、非數字只顯示型別，避免輸出過長或過深的內容。"""
    if isinstance(v, str):
        return "{!r}（字串）".format(_clip(v, 40))
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "{}（布林值）".format("true" if v else "false")
    if isinstance(v, (int, float)):
        try:
            return _clip(json.dumps(v), 40)
        except Exception:
            return _jtype(v)
    return _jtype(v)


def _key_label(key):
    return "'{}'".format(_clip(key, 80))


def is_blank_reason(r):
    """reason 是否視為空白（與評分程式相同）：缺漏、null，或 str.strip() 之後為空。

    評分程式對空白的 reason 不計算 BERTScore，配對成功時該筆單句分數記為 0。
    """
    return not isinstance(r, str) or not r.strip()


def is_invisible_only_reason(r):
    """reason 不算空白（str.strip() 之後不為空），但只含零寬空白等不可見字元
    （Unicode 類別 C*、Z*）。評分程式會照常把它送去計算 BERTScore。"""
    if not isinstance(r, str) or not r.strip():
        return False
    return all(unicodedata.category(ch)[0] in "CZ" for ch in r)


def _has_han(s):
    for ch in s:
        o = ord(ch)
        if (0x4E00 <= o <= 0x9FFF or 0x3400 <= o <= 0x4DBF
                or 0xF900 <= o <= 0xFAFF or 0x20000 <= o <= 0x3134F):
            return True
    return False


# ---------------------------------------------------------------- 測試影像清單

def find_test_list(arg):
    """回傳 test_images.csv 的路徑；找不到時列出找過的路徑並結束。"""
    if arg:
        tried = [os.path.abspath(arg)]
        if not os.path.isabs(arg):
            alt = os.path.abspath(os.path.join(HERE, arg))
            if alt not in tried:
                tried.append(alt)
    else:
        tried = [os.path.join(HERE, TEST_LIST_NAME)]
        cwd_path = os.path.join(os.path.abspath(os.getcwd()), TEST_LIST_NAME)
        if os.path.normcase(cwd_path) != os.path.normcase(tried[0]):
            tried.append(cwd_path)
    for p in tried:
        if os.path.isfile(p):
            return p

    lines = ["找不到測試影像清單 {}。已尋找以下位置：".format(
        os.path.basename(arg) if arg else TEST_LIST_NAME)]
    for p in tried:
        lines.append("  {}".format(p))
    if arg:
        lines.append("請確認 --test-images 指定的路徑是否正確。")
    else:
        lines.append("（依序為 make_submission.py 所在的資料夾、目前的工作目錄）")
        lines.append("請把 test_images.csv 放到上述任一資料夾，或用 --test-images 指定路徑，例如：")
        lines.append("  python make_submission.py --check my_submission.json --test-images 路徑/test_images.csv")
    _fail_usage("\n".join(lines))


def load_test_list(path):
    try:
        with open(path, encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f)
            if not reader.fieldnames or "filename" not in [h.strip() for h in reader.fieldnames]:
                _fail_usage("{} 的第一列必須是欄位名稱 filename。".format(path))
            col = [h for h in reader.fieldnames if h.strip() == "filename"][0]
            ids, seen = [], set()
            for row in reader:
                k = (row.get(col) or "").strip()
                if k and k not in seen:
                    seen.add(k)
                    ids.append(k)
    except UnicodeDecodeError:
        _fail_usage("{} 不是 UTF-8 編碼，請使用官方提供的 test_images.csv。".format(path))
    except OSError as e:
        _fail_usage("無法讀取 {}：{}".format(path, e))
    if not ids:
        _fail_usage("{} 中沒有任何影像路徑。".format(path))
    return ids


def _fail_usage(msg):
    sys.stderr.write(msg + "\n")
    sys.exit(EXIT_USAGE)


# ---------------------------------------------------------------- 產生範本

def make_template(test_ids, out, force=False):
    mode = "w" if force else "x"
    try:
        with open(out, mode, encoding="utf-8", newline="\n") as f:
            f.write("{\n")
            for i, k in enumerate(test_ids):
                tail = "," if i < len(test_ids) - 1 else ""
                f.write("  {}: []{}\n".format(json.dumps(k, ensure_ascii=False), tail))
            f.write("}\n")
    except FileExistsError:
        _fail_usage("{} 已存在，為避免覆蓋已填寫的內容，未產生範本。\n"
                    "請改用其他檔名，或加上 --force 覆寫。".format(out))
    except OSError as e:
        _fail_usage("無法寫入 {}：{}".format(out, e))
    print("已產生範本：{}（{} 張測試影像，每張先填空陣列）".format(out, len(test_ids)))
    print("把預測填進對應的陣列後，用 --check 檢查格式：")
    print("  python make_submission.py --check {}".format(out))


# ---------------------------------------------------------------- 讀檔與 JSON 解析

class LoadError(Exception):
    """評分程式在讀入提交檔時就會失敗（檔案過大、編碼錯誤、JSON 不合法等）。"""


class _ConstantError(ValueError):
    pass


def _reject_constant(name):
    raise _ConstantError(name)


def _too_large(size):
    return LoadError("檔案大小 {:,} 位元組（{:.2f} MB），超過上限 {:,} 位元組（50 MB）。"
                     .format(size, size / 1048576.0, MAX_BYTES))


def load_prediction(path):
    """依評分程式 set_prediction 的方式讀入提交檔。

    回傳 (data, size, duplicates)；評分程式會拒收的情況一律丟出 LoadError。
    duplicates 為 [(是否為最外層, [重複的 key, ...]), ...]。
    """
    try:
        size = os.path.getsize(path)
        if size > MAX_BYTES:
            raise _too_large(size)
        with open(path, "rb") as f:
            raw = f.read()
    except OSError as e:
        raise LoadError("無法讀取檔案：{}".format(e))
    data, duplicates = decode_prediction(raw)
    return data, len(raw), duplicates


def decode_prediction(raw):
    """與評分程式 set_prediction 相同：檢查大小、以 UTF-8 解碼、解析 JSON（拒收 NaN / Infinity）。"""
    if len(raw) > MAX_BYTES:
        raise _too_large(len(raw))

    if raw.startswith(b"\xef\xbb\xbf"):
        raise LoadError("檔案開頭有 UTF-8 BOM（EF BB BF），評分程式會拒收。請以不含 BOM 的 UTF-8 儲存"
                        "（記事本請選「UTF-8」而不是「具有 BOM 的 UTF-8」；"
                        "Python 請用 encoding=\"utf-8\"，不要用 \"utf-8-sig\"）。")
    if raw.startswith(b"\xff\xfe") or raw.startswith(b"\xfe\xff"):
        raise LoadError("檔案是 UTF-16 編碼（例如記事本的「UTF-16 LE」或舊版的「Unicode」），評分程式會拒收。"
                        "請以不含 BOM 的 UTF-8 儲存。")
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as e:
        raise LoadError("檔案不是合法的 UTF-8 編碼（第 {:,} 個位元組附近），評分程式會拒收。"
                        "請以不含 BOM 的 UTF-8 儲存。".format(e.start))

    try:
        # 與評分程式完全相同的解析呼叫
        data = json.loads(text, parse_constant=_reject_constant)
    except _ConstantError as e:
        raise LoadError("NaN、Infinity、-Infinity 出現在檔案任何位置（包括會被忽略的欄位）都會退件"
                        "（檔案中出現 {}）。請改用有限的數值，或刪除該欄位。".format(e))
    except json.JSONDecodeError as e:
        if not text.strip():
            raise LoadError("檔案是空的，不是合法的 JSON。")
        raise LoadError("JSON 解析失敗（第 {} 行第 {} 欄）：{}。常見原因：最後一個元素後面多了逗號、"
                        "使用單引號、字串中有未跳脫的換行或引號、括號沒有成對。"
                        .format(e.lineno, e.colno, e.msg))
    except RecursionError:
        raise LoadError("JSON 巢狀層數過深，無法解析。")
    except Exception as e:  # 例如超長的整數，評分程式同樣無法讀入
        raise LoadError("JSON 解析失敗：{}".format(e))

    return data, _find_duplicate_keys(text, data)


def _find_duplicate_keys(text, data):
    """找出重複的 key（JSON 解析時只保留最後一個），只用於提醒，不影響通過與否。

    回傳 [(是否為最外層, [重複的 key, ...]), ...]；無法判斷時回傳 []。
    """
    state = {"n": 0, "dups": []}

    def pairs_hook(pairs):
        d = dict(pairs)
        if len(d) != len(pairs):
            seen, dk = set(), []
            for k, _ in pairs:
                if k in seen and k not in dk:
                    dk.append(k)
                seen.add(k)
            state["dups"].append((state["n"], dk))
        state["n"] += 1
        return d

    try:
        json.loads(text, parse_constant=_reject_constant, object_pairs_hook=pairs_hook)
    except Exception:
        return []
    last = state["n"] - 1
    return [(isinstance(data, dict) and idx == last, keys) for idx, keys in state["dups"]]


# ---------------------------------------------------------------- 格式驗證

class Problems(object):
    """依評分程式 check_data 的檢查順序收集問題；任一問題都代表評分程式會退件。"""

    def __init__(self):
        self.groups = collections.OrderedDict()
        self.first_code = None  # 評分程式 check_data 會回傳的錯誤碼（對照 README.md 第 9.1 節）

    def add(self, code, title, example, hint=""):
        if self.first_code is None:
            self.first_code = code
        g = self.groups.get(title)
        if g is None:
            g = self.groups[title] = {"code": code, "count": 0, "examples": [], "hint": hint}
        g["count"] += 1
        if len(g["examples"]) < MAX_EXAMPLES:
            g["examples"].append(example)

    def __bool__(self):
        return bool(self.groups)

    @property
    def total(self):
        return sum(g["count"] for g in self.groups.values())


HINTS = {
    "unknown": "key 必須與 test_images.csv 中的字串完全一致，例如 test/EO/image/test_001.jpg"
               "（大小寫、斜線方向、副檔名都要相同，前面不要加 ./ 或其他資料夾名稱）。",
    "not_list": "每張影像的值必須是陣列；沒有偵測結果的影像請寫空陣列 []。",
    "per_image": "每張影像最多 {} 個物件。".format(MAX_OBJECTS_PER_IMAGE),
    "not_dict": "陣列中的每個元素都必須是 {\"label\": ..., \"points\": ...} 形式的物件。",
    "label": "label 必須是 solar_panel、hotspot、crack 三者之一（全小寫，不可缺漏）。",
    "points": "points 必須是含 {}~{} 個頂點的陣列。".format(MIN_VERTICES, MAX_VERTICES),
    "vertex": "每個頂點必須是 [x, y]，恰好兩個數值。",
    "number": "座標必須是數字，不可為字串、null、true/false。",
    "finite": "座標不可溢位成無限大（例如 1e400）。",
    "range": "座標絕對值不可超過 1,000,000。",
    "reason_type": "hotspot / crack 的 reason 必須是單一字串（或省略、null），不可為陣列、數字等其他型別。",
    "reason_len": "reason 最多 {} 字元（以 Unicode 字元計，空白與標點也計入）。".format(MAX_REASON_CHARS),
}


def _vertex_problem(pts):
    """與評分程式相同的頂點檢查；回傳 (錯誤碼, 標題, 說明, 提示) 或 None。"""
    for i, p in enumerate(pts):
        if not isinstance(p, (list, tuple)) or len(p) != 2:
            return (-9, "頂點格式不正確", "第 {} 個頂點是 {}".format(i + 1, _show_value(p)), HINTS["vertex"])
        for v in p:
            if isinstance(v, bool) or not isinstance(v, (int, float)):
                return (-10, "座標不是數值", "第 {} 個頂點含 {}".format(i + 1, _show_value(v)), HINTS["number"])
            try:
                finite = math.isfinite(v)
            except OverflowError:
                # 整數大到無法轉成浮點數：評分程式在此丟出例外（錯誤碼 -15），同樣退件
                return (-15, "座標超出範圍", "第 {} 個頂點含超大整數".format(i + 1), HINTS["range"])
            if not finite:
                return (-11, "座標溢位成無限大", "第 {} 個頂點".format(i + 1), HINTS["finite"])
            if abs(v) > COORD_ABS_LIMIT:
                return (-12, "座標超出範圍", "第 {} 個頂點含 {}".format(i + 1, _show_value(v)), HINTS["range"])
    return None


def validate(data, test_ids):
    """回傳 Problems；為空代表評分程式的 check_data 會接受。"""
    probs = Problems()
    if not isinstance(data, dict):
        probs.add(-1, "最外層必須是 JSON 物件（以影像路徑為 key）",
                  _actual(data),
                  "提交檔最外層必須是 {...}，以測試影像路徑為 key。")
        return probs

    valid = set(test_ids)
    for k in data:
        if k not in valid:
            probs.add(-2, "key 不在 test_images.csv 中", _key_label(k), HINTS["unknown"])

    total = 0
    try:
        for key, objs in data.items():
            where = _key_label(key)
            if not isinstance(objs, list):
                probs.add(-3, "影像的值不是陣列", "{}（{}）".format(where, _actual(objs)), HINTS["not_list"])
                continue
            if len(objs) > MAX_OBJECTS_PER_IMAGE:
                probs.add(-4, "單張影像物件數超過上限",
                          "{} 有 {} 個物件".format(where, len(objs)), HINTS["per_image"])
            before = total
            total += len(objs)
            if before <= MAX_TOTAL_OBJECTS < total:
                probs.add(-5, "總物件數超過上限",
                          "累計到 {} 時超過 {:,}".format(where, MAX_TOTAL_OBJECTS),
                          "全部影像合計最多 {:,} 個物件。".format(MAX_TOTAL_OBJECTS))
            for j, o in enumerate(objs):
                at = "{} 第 {} 個物件".format(where, j + 1)
                if not isinstance(o, dict):
                    probs.add(-6, "物件格式不正確", "{}：{}".format(at, _actual(o)), HINTS["not_dict"])
                    continue
                label = o.get("label")
                if label not in CLASSES:
                    probs.add(-7, "label 不正確",
                              "{}：缺少 label 欄位".format(at) if "label" not in o
                              else "{}：label 是 {}".format(at, _show_value(label)),
                              HINTS["label"])
                pts = o.get("points")
                if not isinstance(pts, list) or not (MIN_VERTICES <= len(pts) <= MAX_VERTICES):
                    if "points" not in o:
                        desc = "缺少 points 欄位"
                    elif isinstance(pts, list):
                        desc = "points 有 {} 個頂點".format(len(pts))
                    else:
                        desc = "points {}".format(_actual(pts))
                    probs.add(-8, "points 格式或頂點數不正確", "{}：{}".format(at, desc), HINTS["points"])
                else:
                    vp = _vertex_problem(pts)
                    if vp is not None:
                        code, title, detail, hint = vp
                        probs.add(code, title, "{}：{}".format(at, detail), hint)
                if label in ANOMALY:
                    r = o.get("reason")
                    if r is not None and not isinstance(r, str):
                        probs.add(-13, "reason 不是字串",
                                  "{}（{}）：reason {}".format(at, label, _actual(r)), HINTS["reason_type"])
                    elif isinstance(r, str) and len(r) > MAX_REASON_CHARS:
                        probs.add(-14, "reason 超過 {} 字元".format(MAX_REASON_CHARS),
                                  "{}（{}）：reason 有 {} 字元".format(at, label, len(r)), HINTS["reason_len"])
    except Exception as e:  # 對應評分程式 check_data 的例外處理（錯誤碼 -15）
        probs.add(-15, "檢查時發生未預期的錯誤", "{}: {}".format(type(e).__name__, e),
                  "請確認檔案結構；若確認無誤仍出現此訊息，請向主辦單位回報。")
    if total > MAX_TOTAL_OBJECTS and "總物件數超過上限" in probs.groups:
        probs.groups["總物件數超過上限"]["hint"] = "全部影像合計最多 {:,} 個物件（目前 {:,} 個）。".format(
            MAX_TOTAL_OBJECTS, total)
    return probs


# ---------------------------------------------------------------- 通過後的摘要與提醒

def summarize(data, test_ids, duplicates):
    """格式通過後的統計與提醒（提醒不影響通過與否）。"""
    valid = set(test_ids)
    label_count = collections.Counter()
    blank, blank_ex = 0, []
    invisible, invisible_ex = 0, []
    other_field, other_names = 0, collections.Counter()
    non_han, non_han_ex = 0, []

    for key, objs in data.items():
        for j, o in enumerate(objs):
            label = o["label"]
            label_count[label] += 1
            if label not in ANOMALY:
                continue
            r = o.get("reason")
            at = "{} 第 {} 個物件".format(_key_label(key), j + 1)
            if is_blank_reason(r):
                blank += 1
                if len(blank_ex) < MAX_EXAMPLES:
                    if "reason" not in o:
                        how = "缺漏"
                    elif r is None:
                        how = "為 null"
                    elif r == "":
                        how = "為空字串"
                    else:
                        how = "只有空白 {!r}".format(_clip(r, 30))
                    blank_ex.append("{}：reason {}".format(at, how))
            elif is_invisible_only_reason(r):
                invisible += 1
                if len(invisible_ex) < MAX_EXAMPLES:
                    invisible_ex.append("{}：reason 為 {!r}".format(at, _clip(r, 30)))
            elif not _has_han(r):
                non_han += 1
                if len(non_han_ex) < MAX_EXAMPLES:
                    non_han_ex.append("{}：{!r}".format(at, _clip(r, 30)))
            if is_blank_reason(r) or is_invisible_only_reason(r):
                extra = [k for k in o if k not in KNOWN_FIELDS]
                if extra:
                    other_field += 1
                    other_names.update(extra)

    notes = []
    missing = len(valid) - len(data)
    if missing > 0:
        notes.append(["有 {} 張測試影像未列出，將視為沒有任何偵測結果。".format(missing)])
    if blank:
        notes.append(["有 {} 個 hotspot/crack 物件的 reason 缺漏、為 null，或去除前後空白後為空；"
                      "這些物件配對成功時，單句分數記為 0，並計入所屬成因類別的平均。".format(blank)]
                     + ["例如：{}".format(e) for e in blank_ex])
    if invisible:
        notes.append(["有 {} 個 hotspot/crack 物件的 reason 只含零寬空白（U+200B）等不可見字元。"
                      "這類 reason 不會被視為空白，會照常送去計算 BERTScore，可能得到很低的負分。".format(invisible)]
                     + ["例如：{}".format(e) for e in invisible_ex])
    if other_field:
        names = "、".join("{}（{} 個）".format(_clip(n, 30), c) for n, c in other_names.most_common(8))
        notes.append(["有 {} 個 hotspot/crack 物件沒有有效的 reason，但含有其他欄位：{}。".format(other_field, names),
                      "評分只讀取 reason 欄位（全小寫），寫在其他欄位（例如 root_cause、Reason）的文字不會被讀取。"])
    if non_han:
        notes.append(["有 {} 個 hotspot/crack 物件的 reason 不含任何中文字。標準答案的參考描述為繁體中文，"
                      "評分使用中文 BERT 模型；非中文的 reason 不會被退件，但 BERTScore 通常很低，甚至是負值。"
                      "請以中文撰寫，建議使用繁體中文。".format(non_han)]
                     + ["例如：{}".format(e) for e in non_han_ex])
    top = [k for is_top, ks in duplicates if is_top for k in ks]
    inner = [k for is_top, ks in duplicates if not is_top for k in ks]
    if top:
        notes.append(["最外層有 {} 個影像 key 重複出現，例如 {}；JSON 解析時只保留最後一次出現的內容，"
                      "前面的預測會被忽略。".format(len(top), "、".join(_key_label(k) for k in top[:MAX_EXAMPLES]))])
    if inner:
        names = collections.Counter(inner)
        notes.append(["物件內有 {} 處欄位名稱重複（{}）；JSON 解析時只保留最後一個。".format(
            len(inner), "、".join(_clip(n, 30) for n, _ in names.most_common(5)))])
    return label_count, notes


# ---------------------------------------------------------------- 主程式

def run_check(path, test_ids):
    """執行格式檢查並輸出結果；回傳結束碼。"""
    if not os.path.isfile(path):
        _fail_usage("找不到提交檔 {}".format(path))
    try:
        data, size, duplicates = load_prediction(path)
    except LoadError as e:
        print("格式有問題，評分程式會退件：")
        print("  - {}".format(e))
        return EXIT_FORMAT

    probs = validate(data, test_ids)
    if probs:
        print("格式有問題（共 {} 類、{} 處），評分程式會退件：".format(len(probs.groups), probs.total))
        for title, g in probs.groups.items():
            print("  - {}：{} 處。{}".format(title, g["count"], g["hint"]))
            for ex in g["examples"]:
                print("      例如：{}".format(ex))
            if g["count"] > len(g["examples"]):
                print("      （其餘 {} 處省略）".format(g["count"] - len(g["examples"])))
        return EXIT_FORMAT

    label_count, notes = summarize(data, test_ids, duplicates)
    n_obj = sum(label_count.values())
    print("格式檢查通過：評分程式會接受這個檔案。")
    if size >= 10486:
        shown = "{:.2f} MB".format(size / 1048576.0)
    else:
        shown = "{:,} 位元組".format(size)
    print("  檔案大小    {}（上限 50 MB）".format(shown))
    print("  影像        {} / {} 張".format(len(data), len(set(test_ids))))
    print("  物件        {} 個（{}）".format(
        n_obj, "、".join("{} {}".format(c, label_count.get(c, 0)) for c in CLASSES)))
    if notes:
        print("提醒（不影響通過與否）：")
        for lines in notes:
            print("  - {}".format(lines[0]))
            for extra in lines[1:]:
                print("      {}".format(extra))
    print("通過格式檢查只代表可以被正常評分，不代表分數高低。")
    return EXIT_OK


def main(argv=None):
    _safe_streams()
    ap = argparse.ArgumentParser(
        description="產生提交檔範本，或檢查提交檔格式（條件與官方評分程式相同）。")
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--template", metavar="OUT", help="產生涵蓋全部測試影像的空白範本")
    g.add_argument("--check", metavar="FILE", help="檢查提交檔格式")
    ap.add_argument("--test-images", metavar="CSV", default=None,
                    help="測試影像清單；預設依序尋找本程式所在資料夾與目前工作目錄下的 test_images.csv")
    ap.add_argument("--force", action="store_true", help="--template 時允許覆寫已存在的檔案")
    args = ap.parse_args(argv)

    test_ids = load_test_list(find_test_list(args.test_images))
    if args.template:
        make_template(test_ids, args.template, force=args.force)
        return EXIT_OK
    return run_check(args.check, test_ids)


if __name__ == "__main__":
    sys.exit(main())
