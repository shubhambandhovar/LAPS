import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  Plus,
  Edit,
  Eye,
  FileCode,
  AlertCircle,
} from 'lucide-react';

interface TemplateRecord {
  _id: string;
  code: string;
  name: string;
  category: string;
  channels: ('IN_APP' | 'EMAIL' | 'SMS')[];
  subjectTemplate?: string;
  bodyTemplate: string;
  variables: string[];
  locale: string;
  isActive: boolean;
}

export const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('GENERAL');
  const [channels, setChannels] = useState<('IN_APP' | 'EMAIL' | 'SMS')[]>(['IN_APP', 'EMAIL', 'SMS']);
  const [subjectTemplate, setSubjectTemplate] = useState('');
  const [bodyTemplate, setBodyTemplate] = useState('');
  const [variablesInput, setVariablesInput] = useState('');
  const [locale, setLocale] = useState('en');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Preview state
  const [previewTemplate, setPreviewTemplateState] = useState<TemplateRecord | null>(null);
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  const [renderedSubject, setRenderedSubject] = useState<string>('');
  const [renderedBody, setRenderedBody] = useState<string>('');

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/templates');
      setTemplates(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load notification templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setCode('');
    setName('');
    setCategory('GENERAL');
    setChannels(['IN_APP', 'EMAIL', 'SMS']);
    setSubjectTemplate('');
    setBodyTemplate('');
    setVariablesInput('');
    setLocale('en');
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (item: TemplateRecord) => {
    setEditingId(item._id);
    setCode(item.code);
    setName(item.name);
    setCategory(item.category);
    setChannels(item.channels);
    setSubjectTemplate(item.subjectTemplate || '');
    setBodyTemplate(item.bodyTemplate);
    setVariablesInput(item.variables ? item.variables.join(', ') : '');
    setLocale(item.locale || 'en');
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenPreview = async (item: TemplateRecord) => {
    setPreviewTemplateState(item);
    const initialVars: Record<string, string> = {};
    if (item.variables) {
      item.variables.forEach((v) => {
        initialVars[v] = `Sample_${v}`;
      });
    }
    setPreviewVariables(initialVars);

    try {
      const res = await apiClient.post(`/templates/${item._id}/preview`, {
        variables: initialVars,
      });
      setRenderedSubject(res.data.data?.renderedSubject || '');
      setRenderedBody(res.data.data?.renderedBody || '');
      setShowPreviewModal(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to render preview');
    }
  };

  const handleUpdatePreview = async (newVars: Record<string, string>) => {
    setPreviewVariables(newVars);
    if (!previewTemplate) return;
    try {
      const res = await apiClient.post(`/templates/${previewTemplate._id}/preview`, {
        variables: newVars,
      });
      setRenderedSubject(res.data.data?.renderedSubject || '');
      setRenderedBody(res.data.data?.renderedBody || '');
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const variables = variablesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: any = {
        code: code.toUpperCase(),
        name,
        category,
        channels,
        subjectTemplate: subjectTemplate || undefined,
        bodyTemplate,
        variables,
        locale,
      };

      if (editingId) {
        await apiClient.put(`/templates/${editingId}`, payload);
      } else {
        await apiClient.post('/templates', payload);
      }

      setShowModal(false);
      fetchTemplates();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save template');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleChannel = (c: 'IN_APP' | 'EMAIL' | 'SMS') => {
    if (channels.includes(c)) {
      if (channels.length === 1) return;
      setChannels(channels.filter((ch) => ch !== c));
    } else {
      setChannels([...channels, c]);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-cyan-50 text-cyan-600 rounded-xl">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Template Manager</h1>
            <p className="text-sm text-gray-500">
              Manage dynamic localization-ready Mustache/Handlebars notification templates
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Template</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <FileCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium mb-4">No notification templates configured yet</p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 text-sm font-medium"
          >
            Create Your First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl._id}
              className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded">
                    {tpl.code}
                  </span>
                  <span className="text-xs uppercase font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {tpl.category}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 mb-1">{tpl.name}</h3>

                {tpl.subjectTemplate && (
                  <p className="text-xs text-gray-500 mb-2 font-mono">
                    Subject: {tpl.subjectTemplate}
                  </p>
                )}

                <p className="text-sm text-gray-700 font-mono bg-gray-50 p-3 rounded-lg border border-gray-100 mb-3 whitespace-pre-line">
                  {tpl.bodyTemplate}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {tpl.channels.map((ch, i) => (
                    <span
                      key={i}
                      className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded"
                    >
                      {ch}
                    </span>
                  ))}
                  {tpl.variables.map((v, i) => (
                    <span
                      key={i}
                      className="text-xs font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 rounded font-mono"
                    >
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleOpenPreview(tpl)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-200 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => handleOpenEdit(tpl)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg text-xs font-semibold hover:bg-cyan-100 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingId ? 'Edit Template' : 'Create Notification Template'}
            </h2>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Template Code *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingId}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FEE_DUE_REMINDER"
                    className="w-full font-mono border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="ATTENDANCE">Attendance</option>
                    <option value="HOMEWORK">Homework</option>
                    <option value="EXAM">Examination</option>
                    <option value="RESULT">Result</option>
                    <option value="FEE">Fee</option>
                    <option value="GENERAL">General</option>
                    <option value="SYSTEM">System</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fee Due Installment Reminder"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Delivery Channels *
                </label>
                <div className="flex space-x-3">
                  {(['IN_APP', 'EMAIL', 'SMS'] as ('IN_APP' | 'EMAIL' | 'SMS')[]).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => toggleChannel(ch)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                        channels.includes(ch)
                          ? 'bg-cyan-600 text-white border-cyan-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Subject Template (Optional for Email/In-App)
                </label>
                <input
                  type="text"
                  value={subjectTemplate}
                  onChange={(e) => setSubjectTemplate(e.target.value)}
                  placeholder="e.g. Installment Due: {{invoiceNumber}}"
                  className="w-full font-mono border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Body Template *
                </label>
                <textarea
                  required
                  rows={4}
                  value={bodyTemplate}
                  onChange={(e) => setBodyTemplate(e.target.value)}
                  placeholder="e.g. Dear {{studentName}}, your fee installment of {{amount}} is due on {{dueDate}}."
                  className="w-full font-mono border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Variables (comma-separated names without braces)
                </label>
                <input
                  type="text"
                  value={variablesInput}
                  onChange={(e) => setVariablesInput(e.target.value)}
                  placeholder="e.g. studentName, amount, dueDate"
                  className="w-full font-mono border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPreviewModal && previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Template Preview — <span className="font-mono text-cyan-700">{previewTemplate.code}</span>
            </h2>

            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-2">
                Sample Variable Values
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {Object.entries(previewVariables).map(([key, val]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <span className="font-mono text-xs w-28 text-gray-600 truncate">{key}:</span>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) =>
                        handleUpdatePreview({ ...previewVariables, [key]: e.target.value })
                      }
                      className="flex-1 font-mono text-xs border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 font-mono text-sm space-y-2">
              {renderedSubject && (
                <div className="font-bold text-gray-900 border-b border-gray-200 pb-2">
                  Subject: {renderedSubject}
                </div>
              )}
              <div className="text-gray-700 whitespace-pre-line">{renderedBody}</div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
