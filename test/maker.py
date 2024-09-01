import re

def parse_default_value(default_value):
    """处理SQL中DEFAULT值"""
    if default_value.upper() == 'CURRENT_TIMESTAMP':
        return 'CURRENT_TIMESTAMP'  # 特殊处理CURRENT_TIMESTAMP
    elif default_value.startswith("'") and default_value.endswith("'"):
        return f"'{default_value[1:-1]}'"
    else:
        return default_value

def parse_fields(statement):
    """解析字段，返回字段信息和具有默认值的字段字典"""
    fields = re.findall(
        r'(\w+)\s+([A-Z]+(?:\([\d,\' ]+\))?)(?:\s+DEFAULT\s+([^\s,]+))?', statement, re.IGNORECASE
    )
    parsed_fields = []
    default_values = {}
    for field in fields:
        field_name, field_type, default_value = field
        if default_value:
            parsed_fields.append((field_name, field_type, default_value))
            parsed_default = parse_default_value(default_value)
            if parsed_default:
                default_values[field_name] = parsed_default
        else:
            parsed_fields.append((field_name, field_type, None))
    return parsed_fields, default_values

# 读取文件中的所有内容
with open('tables.sql', 'r') as file:
    sql_content = file.read()

# 解析每个CREATE TABLE语句
table_statements = re.findall(r'(CREATE TABLE [\s\S]+?;)', sql_content, re.IGNORECASE)

for statement in table_statements:
    # 解析表名
    table_name_match = re.search(r'CREATE TABLE (\w+)', statement, re.IGNORECASE)
    table_name = table_name_match.group(1) if table_name_match else "unknown_table"

    # 解析字段，过滤掉关键字和约束部分
    fields, default_values = parse_fields(statement)

    # 过滤出有效字段，排除约束部分
    valid_fields = [field for field in fields if field[0].upper() not in ['PRIMARY', 'KEY', 'UNIQUE', 'AUTO_INCREMENT', 'NOT', 'NULL', 'CREATE']]

    # 生成 INSERT 和 UPDATE 语句的字段和占位符
    insert_fields = [field[0] for field in valid_fields if field[0] not in default_values]
    insert_placeholders = ', '.join(['?' for _ in insert_fields])
    update_fields = [f'{field[0]} = ?' for field in valid_fields if field[0] not in default_values]
    update_placeholders = ', '.join(update_fields)

    # 准备 TypeScript 代码的模板
    router_template = f"""
import express, {{ Request, Response }} from 'express';
import pool from '../db';

const router = express.Router();

// 创建类型保护函数
function isError(error: unknown): error is Error {{
  return error instanceof Error;
}}

// 创建{table_name}（C）
router.post('/', async (req: Request, res: Response) => {{
  const {{ {', '.join(insert_fields)}, created_at }} = req.body;

  const values = [{', '.join([f"req.body.{field[0]}" if field[0] not in default_values else f"req.body.{field[0]} ?? {default_values[field[0]]}" for field in valid_fields if field[0] not in default_values])}];
  
  let query = `INSERT INTO {table_name} ({', '.join(insert_fields)}) VALUES ({insert_placeholders})`;

  if (created_at !== undefined) {{
    query = `INSERT INTO {table_name} ({', '.join(insert_fields)}, created_at) VALUES ({insert_placeholders}, ?)`;
    values.push(created_at);
  }}

  try {{
    const [result] = await pool.query(query, values);
    res.status(201).json({{
      id: (result as any).insertId,
      name,
      email,
      age,
      status,
      ...(created_at !== undefined && {{ created_at }}) // 有条件地添加 created_at
    }});
  }} catch (error) {{
    if (isError(error)) {{
      res.status(500).json({{ error: error.message }});
    }} else {{
      res.status(500).json({{ error: 'Unknown error' }});
    }}
  }}
}});

// 获取所有{table_name}（R）
router.get('/', async (req: Request, res: Response) => {{
  try {{
    const [rows] = await pool.query('SELECT * FROM {table_name}');
    res.json(rows);
  }} catch (error) {{
    if (isError(error)) {{
      res.status(500).json({{ error: error.message }});
    }} else {{
      res.status(500).json({{ error: 'Unknown error' }});
    }}
  }}
}});

// 获取单个{table_name}（R）
router.get('/:id', async (req: Request, res: Response) => {{
  const {{ id }} = req.params;
  try {{
    const [rows] = await pool.query('SELECT * FROM {table_name} WHERE id = ?', [id]);
    if ((rows as any[]).length > 0) {{
      res.json((rows as any)[0]);
    }} else {{
      res.status(404).json({{ message: '{table_name} not found' }});
    }}
  }} catch (error) {{
    if (isError(error)) {{
      res.status(500).json({{ error: error.message }});
    }} else {{
      res.status(500).json({{ error: 'Unknown error' }});
    }}
  }}
}});

// 更新{table_name}（U）
router.put('/:id', async (req: Request, res: Response) => {{
  const {{ id }} = req.params;
  const {{ {', '.join([field[0] for field in valid_fields if field[0] != 'id'])} }} = req.body;
  
  const values = [{', '.join([f"req.body.{field[0]}" if field[0] not in default_values else f"req.body.{field[0]} ?? {default_values[field[0]]}" for field in valid_fields if field[0] != 'id' and field[0] not in default_values])}, id];
  
  let query = `UPDATE {table_name} SET {update_placeholders} WHERE id = ?`;

  if (created_at !== undefined) {{
    query = `UPDATE {table_name} SET {update_placeholders}, created_at = ? WHERE id = ?`;
    values.push(created_at);
  }}

  try {{
    const [result] = await pool.query(query, values);
    if ((result as any).affectedRows > 0) {{
      res.json({{ id, {', '.join([field[0] for field in valid_fields if field[0] != 'id'])} }});
    }} else {{
      res.status(404).json({{ message: '{table_name} not found' }});
    }}
  }} catch (error) {{
    if (isError(error)) {{
      res.status(500).json({{ error: error.message }});
    }} else {{
      res.status(500).json({{ error: 'Unknown error' }});
    }}
  }}
}});

// 删除{table_name}（D）
router.delete('/:id', async (req: Request, res: Response) => {{
  const {{ id }} = req.params;
  try {{
    const [result] = await pool.query('DELETE FROM {table_name} WHERE id = ?', [id]);
    if ((result as any).affectedRows > 0) {{
      res.status(204).send();
    }} else {{
      res.status(404).json({{ message: '{table_name} not found' }});
    }}
  }} catch (error) {{
    if (isError(error)) {{
      res.status(500).json({{ error: error.message }});
    }} else {{
      res.status(500).json({{ error: 'Unknown error' }});
    }}
  }}
}});

export default router;
"""

    # 将生成的代码写入文件
    output_file = f"{table_name}_router.ts"
    with open(output_file, "w") as file:
        file.write(router_template)

    print(f"TypeScript router file generated: {output_file}")
