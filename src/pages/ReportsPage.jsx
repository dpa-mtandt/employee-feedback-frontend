import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import DashboardLayout from '../layouts/DashboardLayout';
import { reportService } from '../services/reportService';
import { authService } from '../services/authService';

const formatLabel = (value) => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const ratingCategoryData = (rows) => ['communication', 'teamwork', 'respect', 'responsibility', 'leadership'].map((key) => {
  const values = rows.map((row) => Number(row[key] || 0)).filter(Boolean);
  const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  return { name: formatLabel(key), average: Number(average.toFixed(2)) };
});

const EditFeedbackModal = ({ feedback, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState(feedback || {});

  useEffect(() => {
    setFormData(feedback || {});
  }, [feedback]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Edit Feedback</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {['communication', 'teamwork', 'respect', 'responsibility', 'leadership'].map(field => (
            <div key={field}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {formatLabel(field)}
              </label>
              <input
                type="number"
                name={field}
                value={formData[field] || ''}
                onChange={handleChange}
                min="1"
                max="5"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Comments
            </label>
            <textarea
              name="comment"
              value={formData.comment || ''}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
            />
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ReportsPage = () => {
  const [reportType, setReportType] = useState('employee');
  const [companyId, setCompanyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const user = authService.getUser();
  const isSuperAdmin = user?.role === 'super_admin';
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isSuperAdmin && user?.company_id) {
      setCompanyId(String(user.company_id));
      if (reportType === 'company') setReportType('employee');
    }
  }, [isSuperAdmin, reportType, user?.company_id]);

  const employeeFeedbackQuery = useQuery({ queryKey: ['report-employee-feedback', companyId, departmentId, employeeId, startDate, endDate], queryFn: () => reportService.getEmployeeFeedbackReport({ company_id: companyId, department_id: departmentId, employee_id: employeeId, start_date: startDate, end_date: endDate }), enabled: reportType === 'employee' });
  const companyQuery = useQuery({ queryKey: ['report-company'], queryFn: reportService.getCompanyReport, enabled: reportType === 'company' });
  const departmentQuery = useQuery({ queryKey: ['report-department'], queryFn: reportService.getDepartmentReport, enabled: reportType === 'department' });

  const deleteMutation = useMutation({
    mutationFn: reportService.deleteFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-employee-feedback'] });
      alert('Feedback deleted successfully');
    },
    onError: (error) => {
      alert('Error deleting feedback: ' + (error.response?.data?.message || error.message));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => reportService.updateFeedback(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-employee-feedback'] });
      setIsEditModalOpen(false);
      setEditingFeedback(null);
      alert('Feedback updated successfully');
    },
    onError: (error) => {
      alert('Error updating feedback: ' + (error.response?.data?.message || error.message));
    }
  });

  const data = reportType === 'employee' ? employeeFeedbackQuery.data || [] : reportType === 'company' ? companyQuery.data || [] : departmentQuery.data || [];

  const chartData = useMemo(() => {
    if (reportType === 'employee') {
      return {
        primary: data.map((row) => ({
          name: row.given_to_name || `#${row.given_to}`,
          score: Number(row.overall_rating || 0)
        })).slice(0, 12),
        secondary: ratingCategoryData(data)
      };
    }

    if (reportType === 'company') {
      return {
        primary: data.map((row) => ({
          name: row.company_name,
          employees: Number(row.employee_count || 0),
          feedback: Number(row.feedback_count || 0),
          score: Number(row.company_score || 0)
        }))
      };
    }

    return {
      primary: data.map((row) => ({
        name: row.department_name,
        employees: Number(row.employee_count || 0),
        feedback: Number(row.feedback_count || 0),
        score: Number(row.department_score || 0)
      }))
    };
  }, [data, reportType]);

  const totals = useMemo(() => {
    if (!data.length) return [];
    if (reportType === 'company') {
      return [
        { label: 'Companies', value: data.length },
        { label: 'Employees', value: data.reduce((sum, row) => sum + Number(row.employee_count || 0), 0) },
        { label: 'Feedback', value: data.reduce((sum, row) => sum + Number(row.feedback_count || 0), 0) }
      ];
    }
    if (reportType === 'department') {
      return [
        { label: 'Departments', value: data.length },
        { label: 'Employees', value: data.reduce((sum, row) => sum + Number(row.employee_count || 0), 0) },
        { label: 'Feedback', value: data.reduce((sum, row) => sum + Number(row.feedback_count || 0), 0) }
      ];
    }
    if (reportType === 'employee') {
      const average = data.length ? data.reduce((sum, row) => sum + Number(row.overall_rating || 0), 0) / data.length : 0;
      return [
        { label: 'Feedback Entries', value: data.length },
        { label: 'Average Rating', value: average.toFixed(2) }
      ];
    }
    return [];
  }, [data, reportType]);

  const downloadExcel = async () => {
    let endpoint = '/reports/employee-feedback';
    const params = { company_id: companyId, department_id: departmentId, employee_id: employeeId, start_date: startDate, end_date: endDate };
    if (reportType === 'company') {
      endpoint = '/reports/company';
    } else if (reportType === 'department') {
      endpoint = '/reports/department';
    }

    const blob = await reportService.downloadReport(endpoint, params);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportType}-report.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleEditClick = (feedback) => {
    setEditingFeedback(feedback);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (feedbackId) => {
    if (window.confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
      deleteMutation.mutate(feedbackId);
    }
  };

  const handleSaveEdit = (formData) => {
    updateMutation.mutate({
      id: editingFeedback.id,
      data: formData
    });
  };

  return (
    <DashboardLayout>
      <div className="page-panel space-y-6">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h1 className="page-title">Reports</h1>
            <p className="page-subtitle">Dedicated reporting for feedback, company, and department analytics.</p>
          </div>
          <button className="btn-secondary w-full sm:w-auto" onClick={downloadExcel}>Export Excel</button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <select className="input-field" value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="employee">Feedback-Rating App Report</option>
            {isSuperAdmin && <option value="company">Company Report</option>}
            <option value="department">Department Report</option>
          </select>
          <input className="input-field" placeholder="Company ID" value={companyId} onChange={(e) => setCompanyId(e.target.value)} readOnly={!isSuperAdmin} />
          <input className="input-field" placeholder="Department ID" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} />
          {reportType === 'employee' && <input className="input-field" placeholder="Employee ID" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />}
          <input type="date" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" className="input-field" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {totals.map((item) => (
            <div key={item.label} className="card bg-gray-50">
              <div className="text-sm text-gray-500">{item.label}</div>
              <div className="text-2xl font-bold text-gray-900">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reportType === 'employee' && (
            <>
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Feedback Scores</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.primary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Average By Category</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.secondary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Bar dataKey="average" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {reportType === 'company' && (
            <>
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Company Activity</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.primary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="employees" fill="#2563eb" />
                    <Bar dataKey="feedback" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Company Scores</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.primary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {reportType === 'department' && (
            <>
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Department Activity</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.primary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="employees" fill="#2563eb" />
                    <Bar dataKey="feedback" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Department Scores</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.primary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#14b8a6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full responsive-table">
            <thead>
              <tr className="bg-gray-100 border-b">
                {data?.[0] ? Object.keys(data[0]).map((key) => <th key={key} className="px-4 py-2 text-left">{key}</th>) : <th className="px-4 py-2 text-left">No data</th>}
                {isSuperAdmin && reportType === 'employee' && <th className="px-4 py-2 text-left">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {data?.length ? data.map((row, index) => (
                <tr key={index} className="border-b">
                  {Object.entries(row).map(([key, value]) => (
                    <td key={key} data-label={key} className="px-4 py-2">{String(value)}</td>
                  ))}
                  {isSuperAdmin && reportType === 'employee' && (
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        onClick={() => handleEditClick(row)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(row.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  )}
                </tr>
              )) : (
                <tr>
                  <td className="px-4 py-2 text-center text-gray-500">No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditFeedbackModal
        feedback={editingFeedback}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingFeedback(null);
        }}
        onSave={handleSaveEdit}
      />
    </DashboardLayout>
  );
};

export default ReportsPage;
