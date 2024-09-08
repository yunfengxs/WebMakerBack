import express from 'express';
import bodyParser from 'body-parser';
//import userRoutes from './routes/users';
import userRoutes from './routes/users_router';
import user_mulRoutes from './routes/users_mul_router';
import father_routes from './routes/father_router';
import weapons_routes from './routes/weapons_router'

const app = express();
const port = 8090;
app.use((req, res, next) => {
	//console.log('CORS headers added for request:', req);
	res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:8080');  // 设置允许的来源
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');  // 设置允许的方法
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');  // 设置允许的头部
  res.setHeader('Access-Control-Allow-Credentials', 'true');  // 如果需要支持cookie，可以开启
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);  // 对于 OPTIONS 预检请求，返回 200 响应
  }
  next();
});

// 使用 bodyParser 解析 JSON 请求
app.use(bodyParser.json());

// 使用用户路由
app.use('/users', userRoutes);
app.use('/users_mul', user_mulRoutes);
app.use('/father', father_routes);
app.use('/weapons', weapons_routes);

// 启动服务器
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

