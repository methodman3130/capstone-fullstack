import api from './client';

/**
 * Every product call lives here, so a component never builds a URL by hand.
 * Note how filtering uses query params on the SAME endpoint - that mirrors
 * the REST design on the server.
 */
export const productsApi = {
  list: (params = {}) => {
    // Strip empty values so the URL stays clean: ?search=&category= is noise.
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
    );
    return api.get('/products', { params: clean }).then((r) => r.data);
  },

  get: (id) => api.get(`/products/${id}`).then((r) => r.data),

  create: (payload) => api.post('/products', payload).then((r) => r.data),

  update: (id, payload) => api.patch(`/products/${id}`, payload).then((r) => r.data),

  remove: (id) => api.delete(`/products/${id}`).then((r) => r.data),
};
