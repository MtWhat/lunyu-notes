
import re

html_path = '/home/jrm/github/lunyu/home.html'

# Define categories
categories = {
    "孔門諸賢": ["confucius", "yanhui", "zengzi", "zilu", "zigong", "zixia", "ziyou", "zaiyu", "ranyou", "ranboniu", "youro", "minziqian", "fanchi", "nangongkuo", "zhonggong", "zhuansunshi", "yuanxian", "ziyu", "zengxi", "chenkang", "boyu", "gongxihua", "wumaqi", "yuanrang"],
    "魯國人": ["jishi", "zansun", "gongboliao", "shusunwushu", "mengyizi", "aigong", "shizhi"],
    "外國人": ["yegong", "yanzi", "qijinggong", "weilinggong", "gongsunchao", "nanzi", "zihan", "huantui", "chensibai", "jizicheng"],
    "古人": ["yi", "ao", "guanzhong", "qihuangong"]
}

def get_category(char_id):
    for cat, ids in categories.items():
        if char_id in ids:
            return cat
    return "其他"

with open(html_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
in_db = False

for line in lines:
    stripped = line.strip()
    if 'const charactersDB = [' in line:
        in_db = True
        new_lines.append(line)
        continue

    if in_db and stripped.startswith('];'):
        in_db = False
        new_lines.append(line)
        continue

    if in_db and stripped.startswith('{'):
        # Extract ID
        id_match = re.search(r'id:\s*"([^"]+)"', line)
        if id_match:
            char_id = id_match.group(1)
            category = get_category(char_id)

            # Insert category
            # We look for 'relation:' to insert before it, or append if not found
            if 'relation:' in line:
                # Use simple string replacement to avoid regex issues with special chars
                parts = line.split('relation:')
                new_line = parts[0] + f'category: "{category}", relation:' + parts[1]
                new_lines.append(new_line)
            else:
                # Append before closing brace
                last_brace_idx = line.rfind('}')
                if last_brace_idx != -1:
                    new_line = line[:last_brace_idx] + f', category: "{category}" ' + line[last_brace_idx:]
                    new_lines.append(new_line)
                else:
                    new_lines.append(line) # Should not happen
        else:
            new_lines.append(line)
    else:
        new_lines.append(line)

with open(html_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Successfully added categories to charactersDB")
