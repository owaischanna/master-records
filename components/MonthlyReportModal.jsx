import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function MonthlyReportModal({ isOpen, onClose, record, sheetName, mode = 'edit', onSave }) {
  const normalizeKey = (input) => String(input ?? '').toLowerCase().trim().replace(/[\s\u00A0\-_'"\/\\()]+/g, '');
  const getField = (row, keys) => {
    if (!row || typeof row !== 'object') return '';

    for (const key of keys) {
      if (Object.prototype.hasOwnProperty.call(row, key)) {
        const value = row[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') return value;
      }
      const normalized = normalizeKey(key);
      const matchedKey = Object.keys(row).find((rowKey) => normalizeKey(rowKey) === normalized);
      if (matchedKey) {
        const value = row[matchedKey];
        if (value !== undefined && value !== null && String(value).trim() !== '') return value;
      }
    }
    return '';
  };

  const getInitialForm = () => ({
    'S.#': getField(record, ['S.#', 's.#', 'ID', 'Id']),
    'Beneficary Name': getField(record, ['Beneficary Name', 'Beneficiary Name', 'Full Name', 'Name']),
    "Father's/Husband's Name": getField(record, ["Father's/Husband's Name", 'Father Name', 'Husband Name', 'Father/Husband Name', 'Father Husband Name']),
    'CNIC Number': getField(record, ['CNIC Number', 'CNIC', 'CNIC Number ', 'CNIC ']),
    'Village Name': getField(record, ['Village Name', 'Village Name/Parro', 'Village']),
    'Union Council Name': getField(record, ['Union Council Name', 'Union Council', 'Council Name']),
    'Investment (Business Plan)': getField(record, ['Investment (Business Plan)', 'Investment']),
    'Amount': getField(record, ['Amount', ' Amount ', 'Total Amount']),
    'Recovery Amount': getField(record, ['Recovery Amount', ' Recovery Amount ', 'Total Received']),
    'Receipt #': getField(record, ['Receipt #', 'Receipt']),
    'Date': getField(record, ['Date']),
    'Deposit Slip Number': getField(record, ['Deposit Slip Number', 'Deposit Slip']),
    'Deposit Date': getField(record, ['Deposit Date', 'Deposit date']),
    'Deposit Status': getField(record, ['Deposit Status']),
    'Beneficiary Status': getField(record, ['Beneficiary Status', 'Beneficary Status', 'Status']),
  });

  const [formData, setFormData] = useState(getInitialForm());

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setFormData(getInitialForm());
    setMessage('');
  }, [record, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const rowId = formData['S.#'] ?? record?.['S.#'];
    if (!rowId) {
      setMessage('✗ Please enter S.# before saving.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/update-monthly-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetName,
          id: formData['S.#'] || record?.['S.#'],
          updates: formData
        })
      });

      const result = await response.json();

      if (response.ok) {
        const successMessage = `Saved changes for ${formData['Beneficary Name'] || formData['Beneficiary Name'] || 'record'} (S.# ${rowId})`;
        setMessage('✓ Record updated successfully!');
        if (onSave) onSave(successMessage, 'success');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setMessage('✗ Error: ' + result.message);
      }
    } catch (error) {
      setMessage('✗ Failed to update record');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const name = (record?.['Beneficary Name'] ?? record?.['Beneficiary Name'] ?? record?.['Full Name'] ?? formData['Beneficary Name']) || 'Unknown';
  const cnic = (record?.['CNIC'] ?? record?.['CNIC Number'] ?? formData['CNIC Number']) || 'N/A';
  const title = mode === 'new' ? 'Add New Monthly Record' : 'Update Monthly Record';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-800 text-white px-8 py-6 flex justify-between items-center border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-sm text-slate-300">CNIC: {cnic}</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-300 hover:text-white transition disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* Message Alert */}
          {message && (
            <div className={`p-4 rounded-lg text-sm font-semibold ${
              message.startsWith('✓') 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {message}
            </div>
          )}

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">S.#</label>
              <input
                type="text"
                value={formData['S.#']}
                onChange={(e) => handleChange('S.#', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
                placeholder="Enter serial number"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Beneficiary Name</label>
              <input
                type="text"
                value={formData['Beneficary Name']}
                onChange={(e) => handleChange('Beneficary Name', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
                placeholder="Enter beneficiary name"
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Father/Husband's Name</label>
              <input
                type="text"
                value={formData["Father's/Husband's Name"]}
                onChange={(e) => handleChange("Father's/Husband's Name", e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
                placeholder="Enter father or husband name"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">CNIC Number</label>
              <input
                type="text"
                value={formData['CNIC Number']}
                onChange={(e) => handleChange('CNIC Number', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
                placeholder="Enter CNIC number"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Village Name</label>
              <input
                type="text"
                value={formData['Village Name']}
                onChange={(e) => handleChange('Village Name', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
                placeholder="Enter village name"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Union Council Name</label>
              <input
                type="text"
                value={formData['Union Council Name']}
                onChange={(e) => handleChange('Union Council Name', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
                placeholder="Enter union council"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Investment (Business Plan)</label>
              <input
                type="text"
                value={formData['Investment (Business Plan)']}
                onChange={(e) => handleChange('Investment (Business Plan)', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
                placeholder="Enter investment plan"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Amount</label>
              <input
                type="number"
                value={formData['Amount']}
                onChange={(e) => handleChange('Amount', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
                placeholder="Enter amount"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Recovery Amount (PKR)</label>
              <input
                type="number"
                value={formData['Recovery Amount']}
                onChange={(e) => handleChange('Recovery Amount', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                placeholder="Enter recovery amount"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Receipt #</label>
              <input
                type="text"
                value={formData['Receipt #']}
                onChange={(e) => handleChange('Receipt #', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                placeholder="Enter receipt number"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Receipt Date</label>
              <input
                type="date"
                value={formData['Date']}
                onChange={(e) => handleChange('Date', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Deposit Slip Number</label>
              <input
                type="text"
                value={formData['Deposit Slip Number']}
                onChange={(e) => handleChange('Deposit Slip Number', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                placeholder="Enter deposit slip number"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Deposit Date</label>
              <input
                type="date"
                value={formData['Deposit Date']}
                onChange={(e) => handleChange('Deposit Date', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Deposit Status</label>
              <select
                value={formData['Deposit Status']}
                onChange={(e) => handleChange('Deposit Status', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                disabled={loading}
              >
                <option value="">Select Status</option>
                <option value="Pending">Pending</option>
                <option value="Verified">Verified</option>
                <option value="Rejected">Rejected</option>
                <option value="Processed">Processed</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Beneficiary Status</label>
              <select
                value={formData['Beneficiary Status']}
                onChange={(e) => handleChange('Beneficiary Status', e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition"
                disabled={loading}
              >
                <option value="">Select Status</option>
                <option value="Eligible">Eligible</option>
                <option value="Pending">Pending</option>
                <option value="Not Eligible">Not Eligible</option>
                <option value="Under Review">Under Review</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-slate-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : mode === 'new' ? 'Create Record' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
