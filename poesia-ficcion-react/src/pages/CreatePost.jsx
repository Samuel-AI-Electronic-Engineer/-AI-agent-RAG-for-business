import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../config/api';

function CreatePost() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: '',
        content_type: 'poema',
        content: '',
        excerpt: '',
        tags: '',
        publication_status: 'draft',
    });
    const [error, setError] = useState('');

    const mutation = useMutation({
        mutationFn: async (payload) => {
            const { data } = await api.post('/posts', payload);
            return data;
        },
        onSuccess: () => {
            navigate('/dashboard/publicaciones', { state: { justCreated: true } });
        },
        onError: (err) => {
            setError(err?.response?.data?.detail || 'No se pudo publicar la obra.');
        },
    });

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setError('');

        if (!form.title.trim() || !form.content.trim()) {
            setError('El título y el contenido son obligatorios.');
            return;
        }

        mutation.mutate({
            ...form,
            title: form.title.trim(),
            excerpt: form.excerpt.trim() || undefined,
            tags: form.tags.trim() || undefined,
            publication_status: 'draft',
        });
    };

    return (
        <main className="page page-form">
            <section className="container">
                <div className="form-card" style={{ maxWidth: '720px' }}>
                    <p className="section-label">Nueva obra</p>
                    <h1 style={{ marginTop: 0 }}>Publicar poema o cuento</h1>

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label htmlFor="title">Título</label>
                            <input
                                id="title"
                                name="title"
                                type="text"
                                value={form.title}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Ej: Entre luces de invierno"
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label htmlFor="content_type">Tipo</label>
                            <select
                                id="content_type"
                                name="content_type"
                                value={form.content_type}
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option value="poema">Poema</option>
                                <option value="cuento">Cuento</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label htmlFor="content">Contenido</label>
                            <textarea
                                id="content"
                                name="content"
                                value={form.content}
                                onChange={handleChange}
                                className="input-field"
                                rows={12}
                                style={{ minHeight: '220px', resize: 'vertical' }}
                                placeholder="Escribe tu obra aquí..."
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label htmlFor="excerpt">Extracto</label>
                            <textarea
                                id="excerpt"
                                name="excerpt"
                                value={form.excerpt}
                                onChange={handleChange}
                                className="input-field"
                                rows={4}
                                placeholder="Resumen breve opcional..."
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label htmlFor="tags">Etiquetas</label>
                            <input
                                id="tags"
                                name="tags"
                                type="text"
                                value={form.tags}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="noche, memoria, sueños"
                            />
                        </div>

                        {error && <p className="status-text error" role="alert">{error}</p>}

                        <button type="submit" className="btn-primary" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Publicando...' : 'Publicar obra'}
                        </button>
                    </form>
                </div>
            </section>
        </main>
    );
}

export default CreatePost;
