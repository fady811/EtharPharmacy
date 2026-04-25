export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api',
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  defaultPageSize: 20,
  maxPageSize: 100,
};
