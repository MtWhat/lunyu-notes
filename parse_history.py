import re
import json

def parse_history():
    with open('history.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()

    entries = []
    for idx, line in enumerate(lines, 1):
        line = line.strip()
        if not line:
            continue

        content = line

        item = {
            "id": idx,
            "content": content,
            "age": None,
            "year": None,
            "links": []
        }

        # Look for ages - ORDER MATTERS (Longer first)
        age_patterns = [
            ("七十三", 73), ("六十三", 63), ("六十", 60), ("五十六", 56),
            ("五十", 50), ("四十二", 42), ("三十五", 35), ("三十", 30), ("十七", 17)
        ]

        found_age = False
        for cn, val in age_patterns:
            if f"年{cn}" in content or f"蓋年{cn}" in content or f"年亦{cn}" in content:
                item["age"] = val
                item["year"] = val - 552
                found_age = True
                break

        # New era-based inferences if no age found yet
        if not found_age:
            if "定公十四年" in content:
                item["age"] = 56
                item["year"] = -496
            elif "哀公十四年" in content or "魯哀公十四年" in content:
                item["age"] = 71
                item["year"] = -481

        # Special case for entry 1
        if idx == 1:
            item["age"] = 1
            item["year"] = -551

        # Manual link mapping
        links_map = {
            "君君，臣臣，父父，子子": "XII-11",
            "吾其為東周乎": "XVII-5",
            "匡人其如予何": "IX-5",
            "天之未喪斯文也": "IX-5",
            "予所不者，天厭之": "VI-28",
            "天生德於予，桓魋其如予何": "VII-23",
            "我豈匏瓜也哉，焉能系而不食": "XVII-7",
            "俎豆之事則嘗聞之，軍旅之事未之學也": "XV-1",
            "發憤忘食，樂以忘憂，不知老之將至": "VII-19",
            "歸乎歸乎！吾黨之小子狂簡": "V-22",
            "鳥獸不可與同群": "XVIII-6",
            "四體不勤，五穀不分": "XVIII-7",
            "君子亦有窮乎": "XV-2",
            "君子固窮": "XV-2",
            "予一以貫之": "XV-3",
            "必也正名乎": "XIII-3",
            "知我者其天乎": "XIV-35",
            "三人行，必得我師": "VII-22",
            "硜硜乎，莫己知也": "XIV-42"
        }

        for phrase, link in links_map.items():
            if phrase in content:
                if not any(l["ref"] == link for l in item["links"]):
                    item["links"].append({"text": phrase, "ref": link})

        entries.append(item)

    return entries

if __name__ == "__main__":
    entries = parse_history()
    js_content = "const HISTORY_DATA = " + json.dumps(entries, ensure_ascii=False, indent=4) + ";"
    with open('history_data.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
    print("Generated history_data.js with", len(entries), "entries")
