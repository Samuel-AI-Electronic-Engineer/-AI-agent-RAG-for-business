import api from '../config/api';

export const getPosts = async (page = 1, tipo = null) => {
    const params = { page, per_page: 6 };
    if (tipo) params.content_type = tipo;
    const { data } = await api.get('/posts', { params });
    return data;
};

export const createPost = async (postData) => {
    const { data } = await api.post('/posts', postData);
    return data;
};

export const getPost = async (id) => {
    const { data } = await api.get(`/posts/${id}`);
    return data;
};
