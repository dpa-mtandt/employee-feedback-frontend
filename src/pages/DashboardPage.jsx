import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

import { authService } from '../services/authService';
import DashboardLayout from '../layouts/DashboardLayout';
import { dashboardService } from '../services/dashboardService';

const getRatingCategory = (rating) => {
  if (!rating) return null;
  const score = Number(rating);
  if (score >= 4.5) return { label: 'Excellent', color: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-800' };
  if (score >= 3.5) return { label: 'Good', color: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-800' };
  if (score >= 2.5) return { label: 'Average', color: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-800' };
  return { label: 'Needs Improvement', color: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-800' };
};

const DashboardPage = () => {
  const user = authService.getUser();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', user?.role],
    queryFn: () => dashboardService.getDashboard(user?.role),
    enabled: Boolean(user?.role)
  });

  const summaryCards = data?.cards ? Object.entries(data.cards).map(([key, value]) => ({ key, value })) : [];
  
  // Get average rating for employee
  const getEmployeeAverageRating = () => {
    if (user?.role !== 'employee' || !data?.cards) return null;
    const avgRating = data.cards.average_rating;
    return avgRating;
  };
  
  const averageRating = getEmployeeAverageRating();
  const ratingCategory = getRatingCategory(averageRating);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="dashboard-banner">
          <div>
            <p className="text-sm font-semibold text-blue-100">{new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</p>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Good to see you, {user?.name?.split(' ')[0]}</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">Monitor feedback health, spot trends, and keep your organization moving forward.</p>
          </div>
          <button className="bg-white text-blue-700 inline-flex min-h-11 items-center justify-center rounded-lg px-4 font-semibold shadow-sm hover:bg-blue-50" onClick={() => navigate('/feedback')}>Give feedback</button>
        </section>

        {isLoading && <div className="page-panel py-12 text-center text-slate-500">Preparing your dashboard...</div>}
        {isError && <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">Dashboard data could not be loaded. <button className="font-semibold underline" onClick={() => refetch()}>Try again</button></div>}

        {user?.role === 'employee' && averageRating !== null && (
          <div className="page-panel">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Your Performance Rating</h2>
                <p className="text-sm text-slate-500 mt-1">See where you stand based on received feedback</p>
              </div>
              {ratingCategory && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${ratingCategory.bg} ${ratingCategory.text}`}>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span 
                        key={star} 
                        className={`text-xl ${Number(averageRating) >= star ? 'text-yellow-400' : 'text-slate-300'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <div className="text-2xl font-bold">{Number(averageRating).toFixed(1)}</div>
                  <div className="h-6 w-px bg-slate-300 mx-1" />
                  <span className="font-semibold text-sm uppercase tracking-wide">{ratingCategory.label}</span>
                </div>
              )}
            </div>
            
            {/* Rating Scale Indicator */}
            <div className="mt-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Rating Scale</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-700">Needs Improvement</p>
                    <p className="text-slate-500">&lt; 2.5</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-700">Average</p>
                    <p className="text-slate-500">2.5 - 3.4</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-700">Good</p>
                    <p className="text-slate-500">3.5 - 4.4</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-700">Excellent</p>
                    <p className="text-slate-500">≥ 4.5</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {data?.cards && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Dashboard summary">
            {summaryCards.slice(0, 4).map(({ key, value }) => (
              <div className="metric-card bg-white" key={key}>
                <span>{key.replace(/_/g, ' ')}</span>
                <strong>{String(value ?? 0)}</strong>
              </div>
            ))}
          </section>
        )}

        <div className="page-panel">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div><h2 className="text-lg font-bold text-slate-950">Workspace</h2><p className="text-sm text-slate-500">Shortcuts based on your access level</p></div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-600">{user?.role?.replace('_', ' ')}</span>
          </div>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">

            {user?.role === 'super_admin' && (
              <div className="card cursor-pointer hover:shadow-lg transition" onClick={() => navigate('/companies')}>
                <h2 className="text-xl font-semibold mb-2">Company Management</h2>
                <p className="text-gray-600">Manage companies and their settings</p>
                <button className="mt-4 btn-primary">Go to Companies</button>
              </div>
            )}

            {['super_admin', 'company_admin'].includes(user?.role) && (
              <div className="card cursor-pointer hover:shadow-lg transition" onClick={() => navigate('/departments')}>
                <h2 className="text-xl font-semibold mb-2">Department Management</h2>
                <p className="text-gray-600">Manage departments and their settings</p>
                <button className="mt-4 btn-primary">Go to Departments</button>
              </div>
            )}

            {['super_admin'].includes(user?.role) && (
              <div className="card cursor-pointer hover:shadow-lg transition" onClick={() => navigate('/users')}>
                <h2 className="text-xl font-semibold mb-2">User Management</h2>
                <p className="text-gray-600">Manage super admin and company admin accounts</p>
                <button className="mt-4 btn-primary">Go to Users</button>
              </div>
            )}
          </div>
        </div>

        {user?.role === 'employee' && data?.trend && data.trend.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Monthly Trend</h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey={user?.role === 'employee' ? 'average_rating' : 'feedback_count'} stroke="#2563eb" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {data?.category && (
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">Category Ratings</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={Object.entries(data.category).map(([name, value]) => ({ name, value: Number(value || 0) }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {user?.role === 'company_admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Monthly Feedback Trend</h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data?.monthlyFeedback || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="feedback_count" stroke="#2563eb" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="card lg:col-span-2">

              <h2 className="text-xl font-semibold mb-4">Department Ranking</h2>
              <div className="overflow-x-auto">
                <table className="w-full responsive-table">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="px-4 py-2 text-left">Department</th>
                      <th className="px-4 py-2 text-left">Feedback Count</th>
                      <th className="px-4 py-2 text-left">Average Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.departmentRanking || []).map((item) => (
                      <tr key={item.department_name} className="border-b">
                        <td className="px-4 py-2" data-label="Department">{item.department_name}</td>
                        <td className="px-4 py-2" data-label="Feedback Count">{item.feedback_count}</td>
                        <td className="px-4 py-2" data-label="Average Score">{item.average_score ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {user?.role === 'super_admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Company Ranking</h2>

              <div className="overflow-x-auto">
                <table className="w-full responsive-table">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="px-4 py-2 text-left">Company</th>
                      <th className="px-4 py-2 text-left">Feedback Count</th>
                      <th className="px-4 py-2 text-left">Average Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.companyRanking || []).map((item) => (
                      <tr key={item.company_name} className="border-b">
                        <td className="px-4 py-2" data-label="Company">{item.company_name}</td>
                        <td className="px-4 py-2" data-label="Feedback Count">{item.feedback_count}</td>
                        <td className="px-4 py-2" data-label="Average Score">{item.average_score ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Monthly Feedback</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.monthlyFeedback || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="feedback_count" fill="#7c3aed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Category Averages</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.categoryAverages ? Object.entries(data.categoryAverages).map(([name, value]) => ({ name, value: Number(value || 0) })) : []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Top Companies by Feedback</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.topCompaniesByFeedback || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="company_name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="feedback_count" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Top Companies by Score</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.topCompaniesByAverageScore || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="company_name" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="average_score" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}


        {data?.latestFeedback && (



          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Latest Feedback</h2>

              <div className="space-y-4">
                {(data.latestFeedback || []).slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <span>👤</span>
                      <span>Anonymous User</span>
                    </div>
                    <p className="mt-3 text-slate-600 text-sm leading-7">
                      {item.comment ? item.comment : 'No comment provided.'}
                    </p>
                    <div className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {new Date(item.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
