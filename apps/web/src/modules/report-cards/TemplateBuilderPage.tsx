import React, { useState, useEffect } from 'react';

interface TemplateItem {
  _id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  branding: {
    schoolLogoUrl?: string;
    headerText?: string;
    footerText?: string;
  };
  signatures: {
    showPrincipalSignature: boolean;
    principalTitle?: string;
    showClassTeacherSignature: boolean;
    classTeacherTitle?: string;
  };
  status: 'ACTIVE' | 'ARCHIVED';
}

export const TemplateBuilderPage: React.FC = () => {
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [headerText, setHeaderText] = useState('Little Angels School — Academic Progress Report');
  const [footerText, setFooterText] = useState('Official Report Card — Page 1');
  const [showPrincipal, setShowPrincipal] = useState(true);
  const [principalTitle, setPrincipalTitle] = useState('Principal Signature');
  const [showTeacher, setShowTeacher] = useState(true);
  const [teacherTitle, setTeacherTitle] = useState('Class Teacher Signature');
  const [isDefault, setIsDefault] = useState(true);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/report-card-templates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTemplates(data.data || []);
      } else {
        setError(data.message || 'Failed to list templates');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/report-card-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          academicSessionId: '000000000000000000000001',
          isDefault,
          branding: {
            headerText,
            footerText,
          },
          signatures: {
            showPrincipalSignature: showPrincipal,
            principalTitle,
            showClassTeacherSignature: showTeacher,
            classTeacherTitle: teacherTitle,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Template created successfully');
        setName('');
        setDescription('');
        fetchTemplates();
      } else {
        setError(data.message || 'Failed to create template');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    }
  };

  const handleSetDefault = async (id: string) => {
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/v1/report-card-templates/${id}/default`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Template marked as default');
        fetchTemplates();
      } else {
        setError(data.message || 'Failed to update default template');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report Card Template Builder</h1>
        <p className="text-sm text-gray-600">
          Configure branding, header/footer text, and signature blocks for term report cards
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Template Form */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">New Template</h2>
          <form onSubmit={handleCreateTemplate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Template Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g., Annual Report Template 2026"
                className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Optional description"
                className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Header Text</label>
              <input
                type="text"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Footer Text</label>
              <input
                type="text"
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showPrincipal"
                  checked={showPrincipal}
                  onChange={(e) => setShowPrincipal(e.target.checked)}
                />
                <label htmlFor="showPrincipal" className="text-sm text-gray-700 font-medium">
                  Show Principal Signature
                </label>
              </div>
              {showPrincipal && (
                <input
                  type="text"
                  value={principalTitle}
                  onChange={(e) => setPrincipalTitle(e.target.value)}
                  placeholder="Principal Title"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showTeacher"
                  checked={showTeacher}
                  onChange={(e) => setShowTeacher(e.target.checked)}
                />
                <label htmlFor="showTeacher" className="text-sm text-gray-700 font-medium">
                  Show Class Teacher Signature
                </label>
              </div>
              {showTeacher && (
                <input
                  type="text"
                  value={teacherTitle}
                  onChange={(e) => setTeacherTitle(e.target.value)}
                  placeholder="Class Teacher Title"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
              )}
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
              <label htmlFor="isDefault" className="text-sm text-gray-700 font-medium">
                Set as Default Template
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition text-sm"
            >
              Save Template
            </button>
          </form>
        </div>

        {/* Existing Templates Table */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-base font-semibold text-gray-800">Saved Templates</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No templates found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Header / Footer</th>
                  <th className="py-3 px-6">Signatures</th>
                  <th className="py-3 px-6">Default</th>
                  <th className="py-3 px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
                {templates.map((tpl) => (
                  <tr key={tpl._id} className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-medium text-gray-900">
                      <div>{tpl.name}</div>
                      {tpl.description && (
                        <div className="text-xs text-gray-500">{tpl.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-6 text-xs">
                      <div><span className="font-semibold">H:</span> {tpl.branding?.headerText}</div>
                      <div><span className="font-semibold">F:</span> {tpl.branding?.footerText}</div>
                    </td>
                    <td className="py-3 px-6 text-xs">
                      {tpl.signatures?.showPrincipalSignature && (
                        <div>Principal: {tpl.signatures?.principalTitle}</div>
                      )}
                      {tpl.signatures?.showClassTeacherSignature && (
                        <div>Teacher: {tpl.signatures?.classTeacherTitle}</div>
                      )}
                    </td>
                    <td className="py-3 px-6">
                      {tpl.isDefault ? (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                          Default
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-6">
                      {!tpl.isDefault && (
                        <button
                          onClick={() => handleSetDefault(tpl._id)}
                          className="text-blue-600 hover:underline text-xs font-medium"
                        >
                          Make Default
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
