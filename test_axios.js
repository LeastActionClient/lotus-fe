const axios = require('axios');

const api = axios.create({
  baseURL: 'https://httpbin.org',
});

const originalRequest = api.request.bind(api);

const requestWithPolicy = async (config = {}) => {
  const normalizedConfig = { ...config };
  normalizedConfig.method = (normalizedConfig.method || 'get').toLowerCase();

  return originalRequest(normalizedConfig)
    .then((response) => {
      return response;
    });
};

api.request = requestWithPolicy;
api.post = (url, data, config = {}) => requestWithPolicy({ ...config, method: 'post', url, data });

api.post('/post', { hello: 'world' })
  .then(res => console.log('DATA:', res.data.json))
  .catch(err => console.error(err));
