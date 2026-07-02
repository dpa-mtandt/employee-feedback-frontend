import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../services/authService';
import { useToasts } from '../components/ToastProvider';

const ResetPasswordPage = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const { pushToast } = useToasts();
  const newPassword = watch('newPassword', '');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authService.resetPassword(token || data.token, data.newPassword);
      pushToast({
        type: 'success',
        title: 'Password reset',
        message: 'Your password was updated successfully. You can now log in.'
      });
      navigate('/login');
    } catch (error) {
      pushToast({
        type: 'error',
        title: 'Reset failed',
        message: error.response?.data?.error || 'Unable to reset password.'
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
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-gray-800">Reset Password</h1>
        <p className="text-center text-gray-600 mb-6">
          Set a new password using the secure reset link we sent to your email.
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          {!token && (
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Token</label>
              <input {...register('token', { required: 'Token is required' })} className="input-field" placeholder="Paste token here" />
              {errors.token && <span className="text-red-500 text-sm">{errors.token.message}</span>}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">New Password</label>
            <input
              type="password"
              {...register('newPassword', {
                required: 'New password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' }
              })}
              className="input-field"
              placeholder="Enter new password"
            />
            {errors.newPassword && <span className="text-red-500 text-sm">{errors.newPassword.message}</span>}
            <p className="mt-2 text-sm text-slate-500">Use 8+ characters with uppercase, lowercase, number, and symbol.</p>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Confirm Password</label>
            <input
              type="password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === newPassword || 'Passwords do not match'
              })}
              className="input-field"
              placeholder="Confirm new password"
            />
            {errors.confirmPassword && <span className="text-red-500 text-sm">{errors.confirmPassword.message}</span>}
          </div>

          <button type="submit" disabled={loading} className="w-full btn-primary font-semibold">{loading ? 'Resetting...' : 'Reset Password'}</button>
        </form>

        <div className="text-center mt-4">
          <Link to="/login" className="text-blue-600 hover:underline text-sm">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
