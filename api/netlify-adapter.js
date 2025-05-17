// 为Netlify创建适配器
export function netlifyHandler(handler) {
  return async (event, context) => {
    // 创建一个类似Vercel的请求对象
    const req = {
      query: {},
      headers: event.headers,
      url: event.path
    };

    // 解析查询参数
    const url = new URL(
      event.path,
      `http://${event.headers.host || 'localhost'}`
    );
    
    // 如果有查询字符串，解析它
    if (event.queryStringParameters) {
      Object.keys(event.queryStringParameters).forEach(key => {
        req.query[key] = event.queryStringParameters[key];
      });
    }
    
    // 如果没有查询参数但有查询字符串
    const queryString = url.search.slice(1);
    if (queryString && Object.keys(req.query).length === 0) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) {
          req.query[key] = decodeURIComponent(value);
        }
      });
    }

    // 创建一个类似Vercel的响应对象
    const res = {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=7200'
      },
      body: '',
      setHeader: (name, value) => {
        res.headers[name] = value;
      },
      send: (body) => {
        res.body = body;
      }
    };

    try {
      // 调用原始处理程序
      await handler(req, res);
      
      // 返回Netlify格式的响应
      return {
        statusCode: res.statusCode,
        headers: res.headers,
        body: res.body
      };
    } catch (error) {
      console.error("处理请求时出错:", error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'text/plain' },
        body: `处理请求时出错: ${error.message}`
      };
    }
  };
}
