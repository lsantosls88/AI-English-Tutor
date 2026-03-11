import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';

export default function Auth() {
    const { signIn, signUp, user } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    // If user is already logged in, redirect to home
    if (user) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isLogin) {
                const { error } = await signIn({ email, password });
                if (error) throw error;
            } else {
                if (password !== confirmPassword) {
                    throw new Error('As senhas não coincidem.');
                }
                const { error } = await signUp({ email, password });
                if (error) throw error;
                setMessage('Conta criada com sucesso! Você já pode entrar.');
                setIsLogin(true);
                setPassword('');
                setConfirmPassword('');
            }
        } catch (err) {
            setError(err.message || 'Ocorreu um erro.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-col flex-center" style={{ minHeight: '80vh', padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                <div className="text-center mb-8">
                    {isLogin ? (
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>AI English<span className="text-gradient"> Tutor</span></h1>
                    ) : (
                        <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Criar<span className="text-gradient"> Conta</span></h1>
                    )}
                    <p className="text-secondary text-sm mt-1">
                        {isLogin ? 'Faça login para acessar seus cards' : 'Crie sua conta gratuitamente'}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded text-sm text-center" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
                        {error}
                    </div>
                )}

                {message && (
                    <div className="mb-4 p-3 rounded text-sm text-center" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex-col gap-4">
                    <div>
                        <label className="text-secondary text-sm font-semibold mb-1 block">Email</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="text-secondary text-sm font-semibold mb-1 block">Senha</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div>
                            <label className="text-secondary text-sm font-semibold mb-1 block">Confirmar Senha</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary mt-2" disabled={loading} style={{ height: '3rem' }}>
                        {loading ? 'Aguarde...' : isLogin ? <><LogIn size={18} /> Entrar</> : <><UserPlus size={18} /> Cadastrar</>}
                    </button>
                </form>

                <div className="text-center mt-6 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <p className="text-secondary text-sm">
                        {isLogin ? 'Ainda não tem uma conta? ' : 'Já possui uma conta? '}
                        <button
                            className="text-primary"
                            style={{ background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                                setMessage(null);
                            }}
                            type="button"
                        >
                            {isLogin ? 'Cadastre-se' : 'Faça Login'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
