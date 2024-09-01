import re
import os

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
    fields = re.findall(
        r'(\w+)\s+([A-Z]+(?:\([\d,\' ]+\))?)', statement, re.IGNORECASE
    )

    # 过滤出有效字段，排除约束部分
    valid_fields = []
    for field in fields:
        field_name, field_type = field
        if field_name.upper() not in ['PRIMARY', 'KEY', 'UNIQUE', 'AUTO_INCREMENT', 'NOT', 'NULL', 'DEFAULT', 'CREATE']:
            valid_fields.append(field)

    # 准备生成TypeScript代码的模板
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
  const {{ {', '.join([field[0] for field in valid_fields if field[0] != 'id'])} }} = req.body;
  try {{
    const [result] = await pool.query(
      'INSERT INTO {table_name} ({', '.join([field[0] for field in valid_fields if field[0] != 'id'])}) VALUES ({', '.join(['?' for _ in valid_fields if _[0] != 'id'])})',
      [{', '.join([field[0] for field in valid_fields if field[0] != 'id'])}]
    );
    res.status(201).json({{ id: (result as any).insertId, {', '.join([field[0] for field in valid_fields if field[0] != 'id'])} }});
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
  try {{
    const [result] = await pool.query(
      'UPDATE {table_name} SET {', '.join([f"{field[0]} = ?" for field in valid_fields if field[0] != 'id'])} WHERE id = ?',
      [{', '.join([field[0] for field in valid_fields if field[0] != 'id'])}, id]
    );
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
