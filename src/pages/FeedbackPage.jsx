import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import DashboardLayout from '../layouts/DashboardLayout';
import { feedbackService } from '../services/feedbackService';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { departmentService } from '../services/departmentService';

const toId = (value) => String(value ?? '');

const includesText = (value, term) => String(value ?? '').toLowerCase().includes(term);

const SearchableSelect = ({ id, label, value, options, placeholder, searchPlaceholder, emptyMessage, error, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selectedOption = options.find((option) => toId(option.value) === toId(value));
  const searchTerm = search.trim().toLowerCase();
  const visibleOptions = searchTerm
    ? options.filter((option) => includesText(option.searchText || option.label, searchTerm))
    : options;

  useEffect(() => {
    if (!isOpen) {
      setSearch(selectedOption?.label || '');
    }
  }, [isOpen, selectedOption?.label]);

  return (
    <div className="relative">
      <label htmlFor={id} className="block text-slate-700 font-semibold mb-2 dark:text-slate-200">{label}</label>
      <div className="relative">
        <input
          id={id}
          type="text"
          className="input-field pr-20"
          value={search}
          placeholder={selectedOption ? selectedOption.label : placeholder}
          autoComplete="off"
          onFocus={() => {
            setIsOpen(true);
            setSearch('');
          }}
          onChange={(event) => {
            setSearch(event.target.value);
            setIsOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 120);
          }}
        />
        {value && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
          >
            Clear
          </button>
        )}
      </div>
      {isOpen && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {visibleOptions.length > 0 ? (
            visibleOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-blue-900/30 ${toId(option.value) === toId(value) ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(toId(option.value));
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">{searchTerm ? searchPlaceholder : emptyMessage}</div>
          )}
        </div>
      )}
      {error && <span className="text-red-500 text-sm mt-1 block">{error.message}</span>}
    </div>
  );
};

const FeedbackPage = () => {
  const queryClient = useQueryClient();
  const user = authService.getUser();
  
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({ defaultValues: { is_anonymous: true } });
  
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const selectedCompanyId = watch('company_id');
  const selectedDepartmentId = watch('department_id');
  const selectedEmployeeId = watch('given_to');
  const commentText = watch('comment') || '';

  const { data: companies = [] } = useQuery({
    queryKey: ['feedback-companies'],
    queryFn: companyService.getAllCompanies
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['feedback-departments', 'all'],
    queryFn: () => departmentService.getAllDepartments(null)
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employee-lookup', 'all'],
    queryFn: () => feedbackService.getEmployeeLookup(),
    enabled: Boolean(user)
  });

  const submitMutation = useMutation({
    mutationFn: (data) => feedbackService.createFeedback(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      setIsSubmitted(true);
      setErrorMessage('');
    }
  });

  const activeEmployees = useMemo(() => (
    employees.filter((employee) => toId(employee.id) !== toId(user?.id))
  ), [employees, user?.id]);

  const visibleDepartments = useMemo(() => (
    selectedCompanyId
      ? departments.filter((department) => toId(department.company_id) === toId(selectedCompanyId))
      : departments
  ), [departments, selectedCompanyId]);

  const visibleEmployees = useMemo(() => (
    activeEmployees.filter((employee) => {
      const matchesCompany = !selectedCompanyId || toId(employee.company_id) === toId(selectedCompanyId);
      const matchesDepartment = !selectedDepartmentId || toId(employee.department_id) === toId(selectedDepartmentId);
      return matchesCompany && matchesDepartment;
    })
  ), [activeEmployees, selectedCompanyId, selectedDepartmentId]);

  const selectedEmployee = useMemo(() => (
    visibleEmployees.find((employee) => toId(employee.id) === toId(selectedEmployeeId))
    || employees.find((employee) => toId(employee.id) === toId(selectedEmployeeId))
  ), [visibleEmployees, employees, selectedEmployeeId]);

  const companyOptions = useMemo(() => (
    companies.map((company) => ({
      value: company.id,
      label: company.company_name,
      searchText: company.company_name
    }))
  ), [companies]);

  const departmentOptions = useMemo(() => (
    visibleDepartments.map((department) => ({
      value: department.id,
      label: `${department.department_name} - ${department.company_name}`,
      searchText: `${department.department_name} ${department.company_name}`
    }))
  ), [visibleDepartments]);

  const employeeOptions = useMemo(() => (
    visibleEmployees.map((employee) => ({
      value: employee.id,
      label: `${employee.name} | ${employee.department_name} | ${employee.company_name}`,
      searchText: `${employee.name} ${employee.employee_id} ${employee.department_name} ${employee.company_name}`
    }))
  ), [visibleEmployees]);

  const setFormValue = (field, value) => {
    setValue(field, value, { shouldDirty: true, shouldValidate: true });
  };

  // --- NEW: Helper function to clear all selections at once ---
  const clearAllSelections = () => {
    setFormValue('company_id', '');
    setFormValue('department_id', '');
    setFormValue('given_to', '');
  };

  const handleCompanyChange = (companyId) => {
    if (!companyId) return clearAllSelections(); // Triggers if user clicks "Clear"

    const currentDepartment = departments.find((department) => toId(department.id) === toId(selectedDepartmentId));
    const currentEmployee = activeEmployees.find((employee) => toId(employee.id) === toId(selectedEmployeeId));
    const nextDepartmentId = companyId && currentDepartment?.company_id && toId(currentDepartment.company_id) === toId(companyId)
      ? toId(currentDepartment.id)
      : '';
    const employeeStillMatches = currentEmployee
      && (!companyId || toId(currentEmployee.company_id) === toId(companyId))
      && (!nextDepartmentId || toId(currentEmployee.department_id) === toId(nextDepartmentId));

    setFormValue('company_id', companyId);
    setFormValue('department_id', nextDepartmentId);
    setFormValue('given_to', employeeStillMatches ? toId(currentEmployee.id) : '');
  };

  const handleDepartmentChange = (departmentId) => {
    if (!departmentId) return clearAllSelections(); // Triggers if user clicks "Clear"

    const department = departments.find((item) => toId(item.id) === toId(departmentId));
    const currentEmployee = activeEmployees.find((employee) => toId(employee.id) === toId(selectedEmployeeId));
    const companyId = department ? toId(department.company_id) : toId(selectedCompanyId);
    const employeeStillMatches = currentEmployee
      && (!departmentId || toId(currentEmployee.department_id) === toId(departmentId))
      && (!companyId || toId(currentEmployee.company_id) === toId(companyId));

    setFormValue('department_id', departmentId);
    if (department) {
      setFormValue('company_id', companyId);
    }
    setFormValue('given_to', employeeStillMatches ? toId(currentEmployee.id) : '');
  };

  const handleEmployeeChange = (employeeId) => {
    if (!employeeId) return clearAllSelections(); // Triggers if user clicks "Clear" or "x"

    const employee = activeEmployees.find((item) => toId(item.id) === toId(employeeId));
    setFormValue('given_to', employeeId);
    if (employee) {
      setFormValue('company_id', toId(employee.company_id));
      setFormValue('department_id', toId(employee.department_id));
    }
  };

  const onSubmit = async (data) => {
    setErrorMessage('');
    try {
      const recipient = activeEmployees.find((employee) => toId(employee.id) === toId(data.given_to));
      await submitMutation.mutateAsync({
        ...data,
        given_to: Number(data.given_to),
        communication: Number(data.communication),
        teamwork: Number(data.teamwork),
        respect: Number(data.respect),
        responsibility: Number(data.responsibility),
        leadership: Number(data.leadership),
        company_id: Number(recipient?.company_id || data.company_id),
        department_id: Number(recipient?.department_id || data.department_id),
        is_anonymous: Boolean(data.is_anonymous)
      });
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Unable to submit feedback');
    }
  };

  const handleResetForm = () => {
    reset();
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <DashboardLayout>
        <div className="page-panel mx-auto flex max-w-3xl flex-col items-center justify-center pt-16 text-center">
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm dark:bg-emerald-900/40 dark:text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">Thank You for Your Feedback!</h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            Your feedback has been submitted successfully. We appreciate your time in helping us foster a better, more constructive work environment.
          </p>
          <button
            onClick={handleResetForm}
            className="btn-primary mt-8 px-8 py-3 text-base font-semibold shadow-md"
          >
            Submit Another Feedback
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-panel mx-auto grid max-w-7xl gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Submit Feedback</p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">Enterprise feedback made simple</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Select the employee, rate key performance dimensions, and submit confidential feedback.</p>
            </div>
            <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
              <p className="font-semibold text-slate-900 dark:text-white">Ready to submit</p>
              <p className="mt-1">Modern, secure, and compliant feedback.</p>
            </div>
          </div>
        </div>

        {/* Note: The old errorMessage display was removed from here and moved down below */}

        <form className="grid gap-6 lg:grid-cols-[1.1fr_1.9fr]" onSubmit={handleSubmit(onSubmit)}>
          
          <div className="space-y-6 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Step 1</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">Employee Selection</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Choose the employee you want to provide feedback for.</p>
            </div>

            <input type="hidden" {...register('company_id', { required: 'Company is required' })} />
            <input type="hidden" {...register('department_id', { required: 'Department is required' })} />
            <input type="hidden" {...register('given_to', { required: 'Employee selection is required' })} />

            <div className="space-y-4">
              <SearchableSelect
                id="feedback-employee"
                label="Employee Search"
                value={selectedEmployeeId}
                options={employeeOptions}
                placeholder="Search by name or email"
                searchPlaceholder="No employees match your search."
                emptyMessage="No active recipients available."
                error={errors.given_to}
                onChange={handleEmployeeChange}
              />
              <SearchableSelect
                id="feedback-department"
                label="Department"
                value={selectedDepartmentId}
                options={departmentOptions}
                placeholder="Select department"
                searchPlaceholder="No departments match your search."
                emptyMessage="No departments available."
                error={errors.department_id}
                onChange={handleDepartmentChange}
              />
              <SearchableSelect
                id="feedback-company"
                label="Company"
                value={selectedCompanyId}
                options={companyOptions}
                placeholder="Select company"
                searchPlaceholder="No companies match your search."
                emptyMessage="No companies available."
                error={errors.company_id}
                onChange={handleCompanyChange}
              />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-800">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white">
                  {selectedEmployee ? selectedEmployee.name.split(' ').map((part) => part[0]).slice(0, 2).join('') : '👤'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Selected employee</p>
                  <p className="mt-1 text-base font-semibold text-slate-950 dark:text-white">{selectedEmployee ? selectedEmployee.name : 'No employee selected'}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedEmployee ? `${selectedEmployee.department_name} • ${selectedEmployee.company_name}` : 'Use search to choose a recipient'}</p>
                </div>
                {selectedEmployee && (
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
                    onClick={() => handleEmployeeChange('')}
                    aria-label="Remove selected employee"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5 text-sm text-slate-700 shadow-sm dark:border-cyan-800 dark:bg-cyan-900/30 dark:text-slate-200">
              <p className="font-semibold text-slate-900 dark:text-white">Note</p>
              <ul className="mt-3 space-y-2 list-disc pl-5">
                <li>Your feedback is confidential.</li>
                <li>Provide honest and constructive feedback.</li>
                <li>Focus on behaviour and professionalism.</li>
                <li>Feedback helps employees improve.</li>
              </ul>
            </div>
          </div>

          <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Step 2</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">Give Feedback</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Rate the employee across five dimensions and provide comments.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-800">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Rating Guide</p>
              <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
                {[
                  { value: 1, label: 'Below Average', bgColor: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' },
                  { value: 2, label: 'Average', bgColor: 'bg-orange-50', textColor: 'text-orange-700', borderColor: 'border-orange-200' },
                  { value: 3, label: 'Satisfactory', bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' },
                  { value: 4, label: 'Good', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200' },
                  { value: 5, label: 'Excellent', bgColor: 'bg-emerald-100', textColor: 'text-emerald-800', borderColor: 'border-emerald-300' }
                ].map((item) => (
                  <div key={item.value} className={`rounded-xl border p-4 text-center transition-all duration-200 hover:shadow-md ${item.bgColor} ${item.borderColor} ${item.textColor}`}>
                    <div className="text-2xl font-bold">{item.value}</div>
                    <div className="mt-2 text-xs font-semibold uppercase tracking-wider">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {['communication', 'teamwork', 'respect', 'responsibility', 'leadership'].map((field) => {
                const value = watch(field);
                return (
                  <div key={field} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-800">
                    <input type="hidden" {...register(field, { required: true })} />
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800 capitalize dark:text-white">{field}</span>
                      <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Rate</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map((score) => {
                        const selected = String(value) === String(score);
                        const colors = [
                          { selected: 'bg-red-500 border-red-500 text-white shadow-red-200', hover: 'border-red-400 bg-red-50 text-red-600' },
                          { selected: 'bg-orange-500 border-orange-500 text-white shadow-orange-200', hover: 'border-orange-400 bg-orange-50 text-orange-600' },
                          { selected: 'bg-amber-500 border-amber-500 text-white shadow-amber-200', hover: 'border-amber-400 bg-amber-50 text-amber-600' },
                          { selected: 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-200', hover: 'border-emerald-400 bg-emerald-50 text-emerald-600' },
                          { selected: 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-300', hover: 'border-emerald-500 bg-emerald-100 text-emerald-700' }
                        ];
                        const color = colors[score - 1];
                        return (
                          <button
                            key={score}
                            type="button"
                            className={`rounded-xl border min-h-[44px] min-w-[44px] flex items-center justify-center text-base font-bold transition-all duration-250 ${selected ? `${color.selected} shadow-lg scale-105` : `border-slate-300 bg-white text-slate-700 hover:${color.hover} hover:shadow-md hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200`}`}
                            onClick={() => setFormValue(field, score)}
                          >
                            {score}
                          </button>
                        );
                      })}
                    </div>
                    {errors[field] && <p className="mt-3 text-sm text-red-500 font-medium">This rating is required.</p>}
                  </div>
                );
              })}
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="comment" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Comment</label>
                <textarea
                  id="comment"
                  maxLength={500}
                  rows={5}
                  className="input-field mt-3 min-h-[160px]"
                  placeholder="Share constructive feedback about the employee..."
                  {...register('comment')}
                />
                <div className="mt-2 flex justify-between text-sm text-slate-500 dark:text-slate-400">
                  <span className="italic">Optional</span>
                  <span>{commentText.length}/500</span>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800">
                <label className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                  <input type="checkbox" {...register('is_anonymous')} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900" />
                  <span className="text-sm font-semibold">Submit anonymously</span>
                </label>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Your identity will not be shown to the employee.</p>
              </div>

              {/* --- MOVED API ERROR NOTIFICATION (Like "Feedback already given...") --- */}
              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
                  <p className="font-bold flex items-center gap-2">
                    ⚠️ {errorMessage}
                  </p>
                </div>
              )}

              {/* --- ENHANCED MOBILE ERROR NOTIFICATION FOR MISSING FIELDS --- */}
              {Object.keys(errors).length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-400">
                  <p className="font-bold flex items-center gap-2 mb-2">
                    ⚠️ Cannot submit yet. Missing fields:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 font-medium">
                    {errors.given_to && <li>Employee Selection</li>}
                    {errors.department_id && <li>Department</li>}
                    {errors.company_id && <li>Company</li>}
                    {(errors.communication || errors.teamwork || errors.respect || errors.responsibility || errors.leadership) && (
                      <li>All Performance Ratings (1-5)</li>
                    )}
                  </ul>
                </div>
              )}

              <button type="submit" className="btn-primary w-full justify-center text-base py-3" disabled={submitMutation.isPending}>
                <span>✈️</span>
                Submit Feedback
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default FeedbackPage;
