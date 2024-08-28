import express from 'express';
import bodyParser from 'body-parser';
import userRoutes from './routes/users';

const app = express();
const port = 8090;

// 使用 bodyParser 解析 JSON 请求
app.use(bodyParser.json());

// 使用用户路由
app.use('/users', userRoutes);

// 启动服务器
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

