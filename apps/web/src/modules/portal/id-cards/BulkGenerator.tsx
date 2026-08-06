import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useGetTemplates, useGenerateCard } from '../../../api/idCard';
import { IdCardUserType } from '@laps/shared';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, Users, CheckCircle2 } from 'lucide-react';

export const BulkGenerator: React.FC = () => {
  const [userType, setUserType] = useState<IdCardUserType>(IdCardUserType.STUDENT);
  
  // In a real app we'd have a robust filter/selection list here. 
  // We'll fetch a small list of students to demonstrate selection.
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users', userType],
    queryFn: async () => {
      let url = '';
      if (userType === IdCardUserType.STUDENT) url = '/api/v1/students';
      else if (userType === IdCardUserType.TEACHER) url = '/api/v1/teachers';
      else return [];

      const res = await axios.get(url);
      return res.data.data;
    }
  });

  const { data: templates } = useGetTemplates(userType);
  const { mutateAsync: generateCard, isPending } = useGenerateCard();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [results, setResults] = useState<{ id: string, success: boolean }[]>([]);

  const handleSelectAll = () => {
    if (selectedIds.length === users?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users?.map((u: any) => u.id) || []);
    }
  };

  const handleGenerate = async () => {
    const defaultTemplate = templates?.find(t => t.isDefault);
    if (!defaultTemplate) {
      alert('No default template available for this user type.');
      return;
    }

    const newResults: any[] = [];
    for (const id of selectedIds) {
      try {
        await generateCard({
          referenceId: id,
          userType,
          templateId: defaultTemplate.id
        });
        newResults.push({ id, success: true });
      } catch (e) {
        newResults.push({ id, success: false });
      }
    }
    setResults(newResults);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bulk Generator</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Generate ID cards for multiple users at once.</p>
      </div>

      <div className="flex gap-4">
        <select 
          className="p-2 border rounded"
          value={userType}
          onChange={(e) => setUserType(e.target.value as IdCardUserType)}
        >
          <option value={IdCardUserType.STUDENT}>Students</option>
          <option value={IdCardUserType.TEACHER}>Teachers</option>
          {/* Add Employees etc. */}
        </select>
        
        <Button onClick={handleGenerate} disabled={selectedIds.length === 0 || isPending}>
          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
          Generate for {selectedIds.length} Users
        </Button>
      </div>

      <Card className="p-4">
        {usersLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400 w-8 h-8" /></div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-2">
                  <input type="checkbox" checked={selectedIds.length === users?.length && users?.length > 0} onChange={handleSelectAll} />
                </th>
                <th className="p-2">Name</th>
                <th className="p-2">Admission/Emp No</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u: any) => {
                const result = results.find(r => r.id === u.id);
                return (
                  <tr key={u.id} className="border-b">
                    <td className="p-2">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(p => [...p, u.id]);
                          else setSelectedIds(p => p.filter(id => id !== u.id));
                        }}
                      />
                    </td>
                    <td className="p-2">{u.firstName} {u.lastName}</td>
                    <td className="p-2">{u.admissionNumber || u.employeeId}</td>
                    <td className="p-2">
                      {result ? (
                        result.success ? <CheckCircle2 className="text-green-500 w-5 h-5" /> : <span className="text-red-500 text-sm">Failed</span>
                      ) : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};
