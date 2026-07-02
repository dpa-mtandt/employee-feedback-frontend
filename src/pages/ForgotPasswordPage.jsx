import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../services/authService';
import { useToasts } from '../components/ToastProvider';

const ForgotPasswordPage = ({ theme, setTheme }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const { pushToast } = useToasts();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await authService.forgotPassword(data.email);
      pushToast({
        type: 'success',
        title: 'Reset email sent',
        message: response.message || 'If an account exists, you will receive instructions shortly.'
      });
    } catch (error) {
      pushToast({
        type: 'error',
        title: 'Reset request failed',
        message: error.response?.data?.error || 'Unable to process the reset request.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-700 to-sky-700 flex items-center justify-center p-4">
      <button
        type="button"
        className="btn-neutral fixed right-4 top-4"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>
      <div className="bg-white rounded-lg shadow-2xl p-5 sm:p-8 w-full max-w-md">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-gray-800">Forgot Password</h1>
        <p className="text-center text-gray-600 mb-6">
          Enter your email and we will send a secure reset link if the account exists.
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Email</label>
            <input type="email" {...register('email', { required: 'Email is required' })} className="input-field" placeholder="Enter your email" />
            {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
          </div>
          <button type="submit" disabled={loading} className="w-full btn-primary font-semibold">{loading ? 'Sending...' : 'Send reset email'}</button>
        </form>

        <div className="text-center mt-4">
          <Link to="/login" className="text-blue-600 hover:underline text-sm">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
