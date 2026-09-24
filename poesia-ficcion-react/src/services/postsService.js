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

export const getMyPosts = async (page = 1, perPage = 12, publicationStatus = null) => {
    const params = { page, per_page: perPage };
    if (publicationStatus) params.publication_status = publicationStatus;
    const { data } = await api.get('/posts/mine', { params });
    return data;
};

export const submitPostForReview = async (id) => {
    const { data } = await api.patch(`/posts/${id}/submit-review`);
    return data;
};

export const deletePost = async (id) => {
    await api.delete(`/posts/${id}`);
};

export const getPostStats = async () => {
    const { data } = await api.get('/posts/stats');
    return data;
};
