// import React, { useMemo, useState } from 'react';
// import * as xlsx from 'xlsx';
// import MonthlyReportModal from './MonthlyReportModal';

// export default function MonthlyReports({ data = [], sheetName = 'Data' }) {
//   const [query, setQuery] = useState('');
//   const [selectedStatus, setSelectedStatus] = useState('All');
//   const [page, setPage] = useState(1);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [modalMode, setModalMode] = useState('edit');
//   const [selectedRecord, setSelectedRecord] = useState(null);
//   const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
//   const pageSize = 10;

//   const normalizeKey = (input) => String(input ?? '').toLowerCase().trim().replace(/[\s\u00A0\-_'"\/\\()]+/g, '');

//   const resolveField = (row, keys) => {
//     for (const key of keys) {
//       const direct = row[key];
//       if (direct !== undefined && direct !== null && String(direct).trim() !== '') {
//         return direct;
//       }
//       const normalizedKey = normalizeKey(key);
//       const foundKey = Object.keys(row).find((rowKey) => normalizeKey(rowKey) === normalizedKey);
//       if (foundKey) {
//         const value = row[foundKey];
//         if (value !== undefined && value !== null && String(value).trim() !== '') {
//           return value;
//         }
//       }
//     }
//     return '';
//   };

//   // 1. Data Cleaning & Calculations (Excel Se Aaya Hua Data)
//   const sanitizedData = useMemo(() => {
//     if (!data || !Array.isArray(data)) return [];
//     return data.filter(row => {
//       const serial = row['S.#'] ?? row['s.#'];
//       const name = row['Beneficary Name'] ?? row['Beneficiary Name'] ?? row['Full Name'];
//       return serial && String(name).toLowerCase().trim() !== 'null' && String(name).trim() !== '';
//     });
//   }, [data]);

//   // 2. Summary Stats Calculated Dynamically from Excel Data
//   const stats = useMemo(() => {
//     let totalRecovered = 0;
//     let totalRemaining = 0;
//     let pendingCount = 0;

//     sanitizedData.forEach(row => {
//       const recovered = row[' Recovery Amount '] ?? row['Total Received'] ?? 0;
//       totalRecovered += Number(recovered ?? 0);
//       const status = String(row['Beneficary Status'] ?? row['Status'] ?? '').toLowerCase();
//       if (status === 'pending') {
//         pendingCount++;
//       }
//     });

//     const totalAmount = sanitizedData.reduce((sum, row) => sum + (Number(row[' Amount '] ?? 0) || 0), 0);
//     totalRemaining = totalAmount - totalRecovered;

//     return {
//       totalRecovered,
//       totalRemaining,
//       pendingCount,
//       totalRecords: sanitizedData.length
//     };
//   }, [sanitizedData]);

//   // 3. Search and Status Filter Logic
//   const filteredReports = useMemo(() => {
//     return sanitizedData.filter(row => {
//       const name = String(resolveField(row, ['Beneficary Name', 'Beneficiary Name', 'Full Name'])).toLowerCase();
//       const cnic = String(resolveField(row, ['CNIC', 'CNIC Number', 'CNIC Number ', 'CNIC '])).toLowerCase();
//       const status = String(resolveField(row, ['Status', 'Beneficary Status', 'Beneficiary Status'])).toLowerCase();
//       const matchesSearch = name.includes(query.toLowerCase()) || cnic.includes(query.toLowerCase());
//       const matchesStatus = selectedStatus === 'All' || status === selectedStatus.toLowerCase();
      
//       return matchesSearch && matchesStatus;
//     });
//   }, [sanitizedData, query, selectedStatus]);

//   // 4. Pagination
//   const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
//   const pageData = filteredReports.slice((page - 1) * pageSize, page * pageSize);

//   const handleOpenModal = (record) => {
//     setModalMode('edit');
//     setSelectedRecord(record);
//     setModalOpen(true);
//   };

//   const handleAddNewRecord = () => {
//     setModalMode('new');
//     setSelectedRecord(null);
//     setModalOpen(true);
//   };

//   const handleCloseModal = () => {
//     setModalOpen(false);
//     setSelectedRecord(null);
//   };

//   const showToast = (message, type = 'success') => {
//     setToast({ visible: true, message, type });
//     window.setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 4500);
//   };

//   const handleSaveRecord = (message, type = 'success') => {
//     if (message) showToast(message, type);
//     setTimeout(() => {
//       window.location.reload();
//     }, 1400);
//   };

//   const downloadExcel = () => {
//     const headers = [
//       'S.#',
//       'Beneficiary Name',
//       "Father's/Husband's Name",
//       'CNIC Number',
//       'Village Name',
//       'Union Council Name',
//       'Trade',
//       'Investment (Business Plan)',
//       'Amount',
//       'Recovery Amount',
//       'Receipt #',
//       'Date',
//       'Deposit Slip Number',
//       'Deposit Date',
//       'Deposit Status',
//       'Beneficiary Status'
//     ];

//     const exportData = filteredReports.map((row) => ({
//       'S.#': row['S.#'] ?? row['s.#'] ?? '',
//       'Beneficiary Name': resolveField(row, ['Beneficary Name', 'Beneficiary Name', 'Full Name', 'Name']),
//       "Father's/Husband's Name": resolveField(row, ["Father's/Husband's Name", 'Father Name', 'Husband Name', 'Father/Husband Name', 'Father Husband Name']),
//       'CNIC Number': resolveField(row, ['CNIC Number', 'CNIC', 'CNIC Number ', 'CNIC ']),
//       'Village Name': resolveField(row, ['Village Name', 'Village Name/Parro', 'Village']),
//       'Union Council Name': resolveField(row, ['Union Council Name', 'Union Council', 'Council Name']),
//       'Trade': resolveField(row, ['Trade', 'Investment (Business Plan)', 'Investment']),
//       'Investment (Business Plan)': resolveField(row, ['Investment (Business Plan)', 'Investment']),
//       'Amount': resolveField(row, ['Amount', ' Amount ', 'Total Amount']),
//       'Recovery Amount': resolveField(row, ['Recovery Amount', ' Recovery Amount ', 'Total Received']),
//       'Receipt #': resolveField(row, ['Receipt #', 'Receipt', 'Receipt no', 'Receipt No']),
//       'Date': resolveField(row, ['Date', 'Receipt Date']),
//       'Deposit Slip Number': resolveField(row, ['Deposit Slip Number', 'Deposit Slip', 'Deposit Slip Num', 'Deposit Slip Numb']),
//       'Deposit Date': resolveField(row, ['Deposit Date', 'Deposit date']),
//       'Deposit Status': resolveField(row, ['Deposit Status']),
//       'Beneficiary Status': resolveField(row, ['Beneficary Status', 'Beneficiary Status', 'Status'])
//     }));

//     try {
//       const worksheet = xlsx.utils.json_to_sheet(exportData, { header: headers });
//       const workbook = xlsx.utils.book_new();
//       xlsx.utils.book_append_sheet(workbook, worksheet, sheetName || 'MonthlyReport');
//       const wbout = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
//       const blob = new Blob([wbout], { type: 'application/octet-stream' });
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `${sheetName || 'monthly-report'}.xlsx`;
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       URL.revokeObjectURL(url);
//     } catch (error) {
//       console.error('Excel download failed', error);
//       const csvHeader = headers.map((key) => `"${key}"`).join(',');
//       const csvBody = exportData.map((row) => headers.map((key) => `"${String(row[key] ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
//       const csvBlob = new Blob([csvHeader + '\n' + csvBody], { type: 'text/csv;charset=utf-8;' });
//       const csvUrl = URL.createObjectURL(csvBlob);
//       const a = document.createElement('a');
//       a.href = csvUrl;
//       a.download = `${sheetName || 'monthly-report'}.csv`;
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       URL.revokeObjectURL(csvUrl);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
//       {toast.visible && (
//         <div className={`fixed right-4 top-4 z-50 w-[min(420px,calc(100vw-2rem))] rounded-2xl border p-4 shadow-2xl transition-all duration-300 ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
//           <div className="flex items-start gap-3">
//             <div className="text-lg font-bold">{toast.type === 'success' ? 'Success' : 'Error'}</div>
//             <div className="text-sm leading-6">{toast.message}</div>
//           </div>
//         </div>
//       )}

//       <div className="max-w-[1400px] mx-auto px-6 py-8">
//         <div className="rounded-[2rem] overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-2xl border border-slate-800/70 mb-8">
//           <div className="p-10 sm:p-12 text-white">
//             <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 mb-4">
//               Monthly Dashboard
//             </div>
//             <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">Monthly Progress Reports</h1>
//             <p className="mt-4 max-w-3xl text-base sm:text-lg text-slate-300">Review, update and export your sheet data from the monthly reports interface. Changes are saved back to the Excel database and shown in a notification toast.</p>
//             <div className="mt-8 grid gap-4 sm:grid-cols-3">
//               <div className="rounded-3xl bg-white/10 border border-white/10 p-5 shadow-lg shadow-slate-950/10">
//                 <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Total Records</p>
//                 <p className="mt-3 text-3xl font-semibold text-white">{stats.totalRecords}</p>
//               </div>
//               <div className="rounded-3xl bg-white/10 border border-white/10 p-5 shadow-lg shadow-slate-950/10">
//                 <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Recovered (PKR)</p>
//                 <p className="mt-3 text-3xl font-semibold text-emerald-300">{stats.totalRecovered.toLocaleString()}</p>
//               </div>
//               <div className="rounded-3xl bg-white/10 border border-white/10 p-5 shadow-lg shadow-slate-950/10">
//                 <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Remaining Balance</p>
//                 <p className="mt-3 text-3xl font-semibold text-amber-200">{stats.totalRemaining.toLocaleString()}</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="mb-6 rounded-[2rem] bg-white shadow-xl border border-slate-200/80 p-6">
//           <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
//             <div className="space-y-2">
//               <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">Report Controls</p>
//               <h2 className="text-2xl font-bold text-slate-900">Manage your monthly sheets</h2>
//             </div>
//             <div className="flex flex-wrap items-center gap-3">
//               <button
//                 type="button"
//                 onClick={handleAddNewRecord}
//                 className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
//               >
//                 Add New Record
//               </button>
//               <button
//                 type="button"
//                 onClick={downloadExcel}
//                 className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 transition hover:bg-indigo-700"
//               >
//                 Download Excel
//               </button>
//             </div>
//           </div>

//           <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] items-center">
//             <input
//               type="text"
//               className="w-full min-w-0 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-amber-300"
//               placeholder="Search by beneficiary or CNIC..."
//               value={query}
//               onChange={(e) => { setQuery(e.target.value); setPage(1); }}
//             />

//             <select
//               className="w-full sm:w-[220px] rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-amber-300"
//               value={selectedStatus}
//               onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
//             >
//               <option value="All">All Statuses</option>
//               <option value="Eligible">Eligible</option>
//               <option value="Pending">Pending</option>
//               <option value="Not Eligible">Not Eligible</option>
//             </select>
//           </div>
//         </div>

//         {/* Top Cards Grid (Overview Stats) */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
//           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
//             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider m-0">Total Active Cases</p>
//             <h3 className="text-2xl font-bold text-slate-900 mt-2 m-0">{stats.totalRecords}</h3>
//           </div>
//           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-b-4 border-b-emerald-500">
//             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider m-0">Total Recovered (PKR)</p>
//             <h3 className="text-2xl font-bold text-emerald-600 mt-2 m-0">{stats.totalRecovered.toLocaleString()}</h3>
//           </div>
//           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-b-4 border-b-rose-500">
//             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider m-0">Total Remaining Balance</p>
//             <h3 className="text-2xl font-bold text-rose-600 mt-2 m-0">{stats.totalRemaining.toLocaleString()}</h3>
//           </div>
//           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-b-4 border-b-amber-500">
//             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider m-0">Pending Reviews</p>
//             <h3 className="text-2xl font-bold text-amber-600 mt-2 m-0">{stats.pendingCount}</h3>
//           </div>
//         </div>

//         {/* Filter and Search Action Control Bar */}
//         <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
//           <div className="flex items-center gap-2 w-full sm:w-auto">
//             <input
//               type="text"
//               className="w-full sm:w-80 px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition shadow-sm"
//               placeholder="Search by Beneficiary or CNIC..."
//               value={query}
//               onChange={(e) => { setQuery(e.target.value); setPage(1); }}
//             />
//           </div>

//           {/* Status Dropdown Filter */}
//           <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto justify-end">
//             <div className="flex items-center gap-2">
//               <span className="text-xs font-semibold text-slate-400 uppercase">Filter Status:</span>
//               <select
//                 className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-700 font-medium cursor-pointer shadow-sm"
//                 value={selectedStatus}
//                 onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
//               >
//                 <option value="All">All Statuses</option>
//                 <option value="Eligible">Eligible</option>
//                 <option value="Pending">Pending</option>
//                 <option value="Not Eligible">Not Eligible</option>
//               </select>
//             </div>

//             <div className="flex flex-wrap gap-2 justify-end">
//               <button
//                 type="button"
//                 onClick={handleAddNewRecord}
//                 className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 shadow-sm transition-all duration-200 active:scale-95"
//               >
//                 Add New Record
//               </button>
//               <button
//                 type="button"
//                 onClick={downloadExcel}
//                 className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition-all duration-200 active:scale-95"
//               >
//                 Download Excel
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Main Data Reports Table */}
//         <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden mb-5">
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-slate-200 text-left border-collapse">
//               <thead className="bg-slate-900/95 text-slate-100 backdrop-blur">
//                 <tr>
//                   <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200 w-16">S.#</th>
//                   <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Beneficiary</th>
//                   <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Father/Husband</th>
//                   <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">CNIC</th>
//                   <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Village</th>
//                   <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Union Council</th>
//                   <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Trade</th>
//                   <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Investment</th>
//                   <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Amount</th>
//                   <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Recovery Amount</th>
//                   <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Receipt #</th>
//                   <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Date</th>
//                   <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Deposit Slip</th>
//                   <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Deposit Date</th>
//                   <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Deposit Status</th>
//                   <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Beneficiary Status</th>
//                   <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200 text-center w-24">Action</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-slate-100">
//                 {pageData.map((row, index) => {
//                   const name = resolveField(row, ['Beneficary Name', 'Beneficiary Name', 'Full Name']) || '---';
//                   const father = resolveField(row, ["Father's/Husband's Name", 'Father Name', 'Husband Name']) || '---';
//                   const cnic = resolveField(row, ['CNIC', 'CNIC Number', 'CNIC Number ', 'CNIC ']) || '---';
//                   const village = resolveField(row, ['Village Name/Parro', 'Village Name']) || '---';
//                   const council = resolveField(row, ['Union Council Name', 'Union Council', 'Council Name']) || '---';
//                   const trade = resolveField(row, ['Trade', 'Investment (Business Plan)', 'Investment']) || '---';
//                   const investment = resolveField(row, ['Investment (Business Plan)', 'Investment']) || '---';
//                   const amount = resolveField(row, ['Amount', ' Amount ', 'Total Amount']) || '---';
//                   const recoveryAmount = resolveField(row, ['Recovery Amount', ' Recovery Amount ', 'Total Received']) || '---';
//                   const receiptNumber = resolveField(row, ['Receipt #', 'Receipt']) || '---';
//                   const dateValue = resolveField(row, ['Date']) || '---';
//                   const depositSlip = resolveField(row, ['Deposit Slip Number', 'Deposit Slip']) || '---';
//                   const depositDate = resolveField(row, ['Deposit Date', 'Deposit date']) || '---';
//                   const depositStatus = resolveField(row, ['Deposit Status']) || '---';
//                   const beneficiaryStatus = resolveField(row, ['Beneficary Status', 'Beneficiary Status', 'Status']) || '---';

//                   return (
//                     <tr key={index} className="odd:bg-slate-50 transition hover:bg-slate-100/70">
//                       <td className="px-6 py-4 text-sm font-semibold text-slate-500">{row['S.#'] ?? row['s.#'] ?? '---'}</td>
//                       <td className="px-6 py-4 text-sm font-semibold text-slate-900">{name}</td>
//                       <td className="px-6 py-4 text-sm text-slate-700">{father}</td>
//                       <td className="px-6 py-4 text-sm text-slate-700">{cnic}</td>
//                       <td className="px-6 py-4 text-sm text-slate-700">{village}</td>
//                       <td className="px-6 py-4 text-sm text-slate-700">{council}</td>
//                       <td className="px-6 py-4 text-sm text-slate-700">{trade}</td>
//                       <td className="px-6 py-4 text-sm text-slate-700">{investment}</td>
//                       <td className="px-6 py-4 text-sm font-semibold text-slate-900">{amount}</td>
//                       <td className="px-6 py-4 text-sm font-semibold text-emerald-700">{recoveryAmount}</td>
//                       <td className="px-6 py-4 text-sm text-slate-700">{receiptNumber}</td>
//                       <td className="px-6 py-4 text-sm text-slate-700">{dateValue}</td>
//                       <td className="px-6 py-4 text-sm text-slate-700">{depositSlip}</td>
//                       <td className="px-6 py-4 text-sm text-slate-700">{depositDate}</td>
//                       <td className="px-6 py-4 text-sm text-slate-700">{depositStatus}</td>
//                       <td className="px-6 py-4 text-sm text-slate-700">{beneficiaryStatus}</td>
//                       <td className="px-6 py-4 text-center">
//                         <button
//                           onClick={() => handleOpenModal(row)}
//                           className="px-3 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-full transition shadow-sm"
//                         >
//                           Update
//                         </button>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Pagination Footer */}
//         <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border border-slate-200 rounded-xl px-6 py-4 shadow-sm">
//           <div className="text-xs font-semibold text-slate-500">
//             Showing <span className="text-slate-800">{pageData.length}</span> of <span className="text-slate-800">{filteredReports.length}</span> matching entries
//           </div>
//           <div className="flex items-center gap-1">
//             <button className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition" onClick={() => setPage(1)} disabled={page === 1}>First</button>
//             <button className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
//             <span className="px-4 text-xs font-bold text-slate-700">Page {page} of {totalPages}</span>
//             <button className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
//             <button className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last</button>
//           </div>
//         </div>

//         {/* Modal for Editing Monthly Report Details */}
//         <MonthlyReportModal 
//           isOpen={modalOpen} 
//           onClose={handleCloseModal} 
//           record={selectedRecord} 
//           sheetName={sheetName}
//           mode={modalMode}
//           onSave={handleSaveRecord}
//         />
//       </div>
//     </div>
//   );
// }



import React, { useMemo, useState } from 'react';
import * as xlsx from 'xlsx';
import MonthlyReportModal from './MonthlyReportModal';

export default function MonthlyReports({ data = [], sheetName = 'Data' }) {
  const [query, setQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('edit');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const pageSize = 10;

  const normalizeKey = (input) => String(input ?? '').toLowerCase().trim().replace(/[\s\u00A0\-_'"\/\\()]+/g, '');

  const resolveField = (row, keys) => {
    for (const key of keys) {
      const direct = row[key];
      if (direct !== undefined && direct !== null && String(direct).trim() !== '') {
        return direct;
      }
      const normalizedKey = normalizeKey(key);
      const foundKey = Object.keys(row).find((rowKey) => normalizeKey(rowKey) === normalizedKey);
      if (foundKey) {
        const value = row[foundKey];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          return value;
        }
      }
    }
    return '';
  };

  // 1. Data Cleaning & Normalization
  const sanitizedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.filter(row => {
      const serial = row['s'] ?? row['s_no'] ?? row['id'] ?? row['S.#'] ?? row['s.#'];
      const name = row['full_name'] ?? row['beneficiary_name'] ?? row['Beneficiary Name'] ?? row['Beneficary Name'] ?? row['Full Name'];
      return serial && String(name).toLowerCase().trim() !== 'null' && String(name).trim() !== '';
    });
  }, [data]);

  // 2. Summary Stats Calculated Dynamically (Tracking True Form Deposit Statuses)
  const stats = useMemo(() => {
    let totalRecovered = 0;
    let totalRemaining = 0;
    let pendingCount = 0;
    let totalAmount = 0;

    const parseNum = (val) => {
      if (val === null || val === undefined) return 0;
      const clean = String(val).replace(/[\,RsPKR\s]/g, '');
      return isNaN(Number(clean)) ? 0 : Number(clean);
    };

    sanitizedData.forEach(row => {
      const recovered = row['total_received'] ?? row['recovery_amount'] ?? row['Total Received'] ?? row[' Recovery Amount '] ?? 0;
      totalRecovered += parseNum(recovered);

      const amount = row['amount'] ?? row['Amount'] ?? row['total_due_amount'] ?? row[' Amount '] ?? 0;
      totalAmount += parseNum(amount);

      // 🟢 FIXED: Tally matching rows directly using direct key checks
      const currentDepStatus = String(row.deposit_status || row['Deposit Status'] || 'Pending').toLowerCase().trim();
      if (currentDepStatus === 'pending') {
        pendingCount++;
      }
    });

    totalRemaining = sanitizedData.reduce((sum, row) => sum + parseNum(row['remaining_amount'] ?? row['Remaining Amount'] ?? 0), 0);
    if (totalRemaining === 0 && totalAmount > 0) {
      totalRemaining = Math.max(0, totalAmount - totalRecovered);
    }

    return {
      totalRecovered,
      totalRemaining,
      pendingCount,
      totalRecords: sanitizedData.length
    };
  }, [sanitizedData]);

  // 3. Search and Dynamic Dropdown Filtering Logic
  const filteredReports = useMemo(() => {
    return sanitizedData.filter(row => {
      const name = String(resolveField(row, ['full_name', 'beneficiary_name', 'Beneficary Name', 'Beneficiary Name', 'Full Name'])).toLowerCase();
      const cnic = String(resolveField(row, ['cnic', 'CNIC', 'CNIC Number', 'CNIC Number ', 'CNIC '])).toLowerCase();
      
      // 🟢 FIXED: Read direct values avoiding nested lookup array mismatches
      const currentDepositStatus = String(row.deposit_status || row['Deposit Status'] || 'Pending').toLowerCase().trim();
      
      const matchesSearch = name.includes(query.toLowerCase()) || cnic.includes(query.toLowerCase());
      const matchesStatus = selectedStatus === 'All' || currentDepositStatus === selectedStatus.toLowerCase().trim();
      
      return matchesSearch && matchesStatus;
    });
  }, [sanitizedData, query, selectedStatus]);

  // 4. Pagination
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const pageData = filteredReports.slice((page - 1) * pageSize, page * pageSize);

  const handleOpenModal = (record) => {
    setModalMode('edit');
    setSelectedRecord(record);
    setModalOpen(true);
  };

  const handleAddNewRecord = () => {
    setModalMode('new');
    setSelectedRecord(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRecord(null);
  };

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    window.setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 4500);
  };

  const handleSaveRecord = (message, type = 'success') => {
    if (message) showToast(message, type);
    setTimeout(() => {
      window.location.reload();
    }, 1400);
  };

  const downloadExcel = () => {
    const headers = [
      'S.#', 'Beneficiary Name', "Father's/Husband's Name", 'CNIC Number', 'Village Name',
      'Union Council Name', , 'Investment (Business Plan)', 'Amount', 'Recovery Amount',
      'Receipt #', 'Date', 'Deposit Slip Number', 'Deposit Date', 'Deposit Status', 'Beneficiary Status'
    ];

    const exportData = filteredReports.map((row) => ({
      'S.#': row['s'] ?? row['s_no'] ?? row['S.#'] ?? '',
      'Beneficiary Name': resolveField(row, ['full_name', 'beneficiary_name', 'Beneficiary Name']),
      "Father's/Husband's Name": resolveField(row, ['father_husband_name', "Father's/Husband's Name"]),
      'CNIC Number': resolveField(row, ['cnic', 'CNIC Number', 'CNIC']),
      'Village Name': resolveField(row, ['village_name', 'village_name_parro', 'Village Name']),
      'Union Council Name': resolveField(row, ['union_council', 'Union Council Name']),
     
      'Investment (Business Plan)': resolveField(row, ['business_investment_plan', 'Investment (Business Plan)']),
      'Amount': resolveField(row, ['amount', 'Amount']),
      'Recovery Amount': resolveField(row, ['total_received', 'recovery_amount', 'Recovery Amount']),
      'Receipt #': resolveField(row, ['receipt_number', 'Receipt #']),
      'Date': resolveField(row, ['date', 'Date']),
      'Deposit Slip Number': resolveField(row, ['deposit_slip_number', 'Deposit Slip Number']),
      'Deposit Date': resolveField(row, ['deposit_date', 'Deposit Date']),
      'Deposit Status': resolveField(row, ['deposit_status', 'Deposit Status']),
      'Beneficiary Status': resolveField(row, ['status', 'Status', 'beneficiary_status'])
    }));

    try {
      const worksheet = xlsx.utils.json_to_sheet(exportData, { header: headers });
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, sheetName || 'MonthlyReport');
      xlsx.writeFile(workbook, `${sheetName || 'monthly-report'}.xlsx`);
    } catch (error) {
      console.error('Excel download failed', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans">
      {toast.visible && (
        <div className={`fixed right-4 top-4 z-50 w-[min(420px,calc(100vw-2rem))] rounded-2xl border p-4 shadow-2xl transition-all duration-300 ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
          <div className="flex items-start gap-3">
            <div className="text-lg font-bold">{toast.type === 'success' ? 'Success' : 'Error'}</div>
            <div className="text-sm leading-6">{toast.message}</div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="rounded-[2rem] overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-2xl border border-slate-800/70 mb-8">
          <div className="p-10 sm:p-12 text-white">
            <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 mb-4">
              Monthly Dashboard
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">Monthly Progress Reports</h1>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-white/10 border border-white/10 p-5 shadow-lg shadow-slate-950/10">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Total Records</p>
                <p className="mt-3 text-3xl font-semibold text-white">{stats.totalRecords}</p>
              </div>
              <div className="rounded-3xl bg-white/10 border border-white/10 p-5 shadow-lg shadow-slate-950/10">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Recovered (PKR)</p>
                <p className="mt-3 text-3xl font-semibold text-emerald-300">{stats.totalRecovered.toLocaleString()}</p>
              </div>
              <div className="rounded-3xl bg-white/10 border border-white/10 p-5 shadow-lg shadow-slate-950/10">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Remaining Balance</p>
                <p className="mt-3 text-3xl font-semibold text-amber-200">{stats.totalRemaining.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-[2rem] bg-white shadow-xl border border-slate-200/80 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-600">Report Controls</p>
              <h2 className="text-2xl font-bold text-slate-900">Manage your monthly sheets</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={handleAddNewRecord} className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800">Add New Record</button>
              <button type="button" onClick={downloadExcel} className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/10 transition hover:bg-indigo-700">Download Excel</button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] items-center">
            <input
              type="text"
              className="w-full min-w-0 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-amber-300"
              placeholder="Search by beneficiary or CNIC..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            />

            <select
              className="w-full sm:w-[220px] rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-amber-300 font-medium text-slate-700 cursor-pointer"
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
            >
              <option value="All">All Deposit Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
              <option value="Processed">Processed</option>
            </select>
          </div>
        </div>

        {/* Main Data Table */}
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden mb-5">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left border-collapse">
              <thead className="bg-slate-900/95 text-slate-100 backdrop-blur">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200 w-16">S.#</th>
                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Beneficiary</th>
                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Father/Husband</th>
                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">CNIC</th>
                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Village</th>
                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Union Council</th>
                 
                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Investment</th>
                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Recovery Amount</th>
                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Receipt #</th>
                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Date</th>
                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Deposit Slip</th>
                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Deposit Date</th>
                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Deposit Status</th>
                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200">Beneficiary Status</th>
                  <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageData.map((row, index) => {
                  const serialNo = row['s'] ?? row['s_no'] ?? row['S.#'] ?? '---';
                  const name = resolveField(row, ['full_name', 'beneficiary_name', 'Beneficiary Name']) || '---';
                  const father = resolveField(row, ['father_husband_name', "Father's/Husband's Name"]) || '---';
                  const cnic = resolveField(row, ['cnic', 'CNIC Number', 'CNIC']) || '---';
                  const village = resolveField(row, ['village_name', 'village_name_parro', 'Village Name']) || '---';
                  const council = resolveField(row, ['union_council', 'Union Council Name']) || '---';
                 
                  const investment = resolveField(row, ['business_investment_plan', 'Investment (Business Plan)']) || '---';
                  const amount = resolveField(row, ['amount', 'Amount']) || '---';
                  const recoveryAmount = resolveField(row, ['total_received', 'recovery_amount', 'Recovery Amount']) || '---';
                  
                  const receiptNumber = resolveField(row, ['receipt_number', 'Receipt #']) || '---';
                  const dateValue = resolveField(row, ['date', 'Date']) || '---';
                  const depositSlip = resolveField(row, ['deposit_slip_number', 'Deposit Slip Number']) || '---';
                  const depositDate = resolveField(row, ['deposit_date', 'Deposit Date']) || '---';
                  
                  // 🟢 FIXED: Check direct mapped background keys to prevent overriding form filling positions
                  const rawDepositStatus = row.deposit_status || row['Deposit Status'] || 'Pending';
                  const depositStatus = String(rawDepositStatus).trim() !== '' ? String(rawDepositStatus).trim() : 'Pending';
                  
                  const beneficiaryStatus = resolveField(row, ['status', 'Status', 'beneficiary_status']) || '---';

                  return (
                    <tr key={index} className="odd:bg-slate-50 transition hover:bg-slate-100/70">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-500">{serialNo}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">{name}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{father}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{cnic}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{village}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{council}</td>
                  
                      <td className="px-6 py-4 text-sm text-slate-700">{investment}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-900">{amount}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-emerald-700">{recoveryAmount}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{receiptNumber}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{dateValue}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{depositSlip}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{depositDate}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border capitalize ${
                          depositStatus.toLowerCase() === 'verified' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          depositStatus.toLowerCase() === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          depositStatus.toLowerCase() === 'processed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {depositStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{beneficiaryStatus}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleOpenModal(row)}
                          className="px-3 py-1 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-full transition shadow-sm"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border border-slate-200 rounded-xl px-6 py-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">
            Showing <span className="text-slate-800">{pageData.length}</span> of <span className="text-slate-800">{filteredReports.length}</span> matching entries
          </div>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition" onClick={() => setPage(1)} disabled={page === 1}>First</button>
            <button className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
            <span className="px-4 text-xs font-bold text-slate-700">Page {page} of {totalPages}</span>
            <button className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
            <button className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition" onClick={() => setPage(totalPages)} disabled={page === totalPages}>Last</button>
          </div>
        </div>

        <MonthlyReportModal 
          isOpen={modalOpen} 
          onClose={handleCloseModal} 
          record={selectedRecord} 
          sheetName={sheetName}
          mode={modalMode}
          onSave={handleSaveRecord}
        />
      </div>
    </div>
  );
}